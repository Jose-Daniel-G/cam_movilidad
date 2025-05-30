import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { CommonModule, NgFor, NgIf, NgSwitch, NgSwitchCase } from '@angular/common'; // Explicitly importing NgFor, NgIf etc.
import { FormularioService } from '../../services/formulario.service';
import { Pregunta, FormularioData, OpcionPregunta, ApiResponse } from '../../models/pregunta.model';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, Observable, combineLatest } from 'rxjs';

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  // Ensure all directives used in the template are imported here
  imports: [CommonModule, ReactiveFormsModule, NgFor, NgIf, NgSwitch, NgSwitchCase],
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.css'] // Or .scss if that's what you use
})
export class DynamicFormComponent implements OnInit {
  formularioData: FormularioData | null = null;
  dynamicForm!: FormGroup;
  isLoading = true;
  formId: number | null = null;
  opcionesPorPregunta: Map<number, OpcionPregunta[]> = new Map();

  constructor(
    private fb: FormBuilder,
    private formularioService: FormularioService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.formId = Number(params.get('idFormulario'));
      if (this.formId) {
        this.loadFormulario();
      } else {
        console.error('No se proporcionó un ID de formulario en la URL.');
        this.isLoading = false;
      }
    });
  }

  loadFormulario() {
    this.formularioService.getFormularioCompleto(this.formId!).subscribe({
      next: (response) => {
        if (response.result === 'OK' && response.data) {
          this.formularioData = response.data;
          this.loadPreguntaOptionsAndBuildForm();
        } else {
          console.error('API response not OK or data missing:', response);
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error fetching form data:', error);
        this.isLoading = false;
      }
    });
  }

  loadPreguntaOptionsAndBuildForm() {
    if (!this.formularioData) {
      this.isLoading = false;
      return;
    }

    const listaPreguntas = this.formularioData.preguntas.filter(p => p.tipo === 'LISTA');
    const optionRequests: Observable<ApiResponse>[] = [];

    listaPreguntas.forEach(pregunta => {
      if (this.formId) {
        const payload = { idFormulario: this.formId, idPregunta: pregunta.idPregunta };
        optionRequests.push(this.formularioService.obtenerOpcionesPregunta(payload));
      }
    });

    if (optionRequests.length > 0) {
      forkJoin(optionRequests).subscribe({
        next: (responses: ApiResponse[]) => {
          responses.forEach((res, index) => {
            if (res.result === 'OK' && Array.isArray(res.data)) {
              const preguntaActual = listaPreguntas[index];
              this.opcionesPorPregunta.set(preguntaActual.idPregunta, res.data as OpcionPregunta[]);
            } else {
              console.warn(`Could not load options for question ID ${listaPreguntas[index].idPregunta}:`, res);
            }
          });
          this.buildForm();
        },
        error: (error) => {
          console.error('Error fetching options for LISTA questions:', error);
          this.buildForm(); // Still build the form even if options fail, just without them
        }
      });
    } else {
      this.buildForm();
    }
  }

  buildForm() {
    if (!this.formularioData) return;

    const formGroupConfig: { [key: string]: any } = {};

    this.formularioData.preguntas.forEach(pregunta => {
      const validators = [];
      if (pregunta.requerido === 'SI') {
        validators.push(Validators.required);
      }
      if (pregunta.tipo === 'CORREO') {
        validators.push(Validators.email);
      }
      if (pregunta.tipo === 'NUMERICO' || pregunta.tipo === 'DINEROSR') {
        validators.push(Validators.pattern(/^-?\d*\.?\d*$/));
      }
      if (pregunta.limiteCaracteres) {
        validators.push(Validators.maxLength(pregunta.limiteCaracteres));
      }

      const initialValue = pregunta.valorDefecto || null;
      const isDisabled = pregunta.sololectura === 'SI';

      formGroupConfig[pregunta.nombre] = [{ value: initialValue, disabled: isDisabled }, validators];
    });

    this.dynamicForm = this.fb.group(formGroupConfig);

    // --- Manejo de funciones de webservice y calculadas (Lógica Avanzada) ---
    this.formularioData.preguntas.forEach(pregunta => {
      if (pregunta.funcion) {
        try {
          const funcConfig = JSON.parse(pregunta.funcion);

          if (funcConfig.type === 'webservice' || funcConfig.type === 'calculated_webservice') {
            if (funcConfig.expression.startsWith('Utilidad/getCurrentDate')) {
              this.dynamicForm.get(pregunta.nombre)?.setValue(new Date().toLocaleDateString('es-CO'));
            } else if (funcConfig.expression.startsWith('Utilidad/calcularPenultimoDiaMes')) {
              const date = new Date();
              date.setMonth(date.getMonth() + 1);
              date.setDate(0);
              this.dynamicForm.get(pregunta.nombre)?.setValue(date.toLocaleDateString('es-CO'));
            } else if (funcConfig.expression.startsWith('Utilidad/getValorTotalTasaCongestion?')) {
              const dependentPreguntaId = parseInt(funcConfig.expression.split('?')[1]);
              const dependentPregunta = this.formularioData?.preguntas.find(p => p.idPregunta === dependentPreguntaId);

              if (dependentPregunta) {
                this.dynamicForm.get(dependentPregunta.nombre)?.valueChanges.subscribe(numMeses => {
                  if (numMeses !== null && numMeses !== undefined) {
                    const valorCalculado = numMeses * 10000;
                    this.dynamicForm.get(pregunta.nombre)?.setValue(valorCalculado);
                  }
                });
                const initialNumMeses = this.dynamicForm.get(dependentPregunta.nombre)?.value;
                if (initialNumMeses !== null && initialNumMeses !== undefined) {
                     const valorCalculado = initialNumMeses * 10000;
                     this.dynamicForm.get(pregunta.nombre)?.setValue(valorCalculado);
                }
              }
            }
          } else if (funcConfig.type === 'function' && funcConfig.expression.startsWith('countTrue')) {
            const idsToCheck = funcConfig.expression.match(/\[(\d+)\]/g)?.map((idStr: string) => parseInt(idStr.replace(/\[|\]/g, '')));

            if (idsToCheck && idsToCheck.length > 0) {
              const controlsToWatch = idsToCheck.map((id: number) => {
                const depPregunta = this.formularioData?.preguntas.find(p => p.idPregunta === id);
                return depPregunta ? this.dynamicForm.get(depPregunta.nombre) : null;
              }).filter((control: AbstractControl | null): control is AbstractControl => control !== null); // Corrected filter typing

              if (controlsToWatch.length > 0) {
                combineLatest(controlsToWatch.map((c: AbstractControl) => c.valueChanges)).subscribe(() => { // Corrected 'c' typing
                  let trueCount = 0;
                  controlsToWatch.forEach((controlItem: AbstractControl) => { // Corrected 'controlItem' typing
                    if (controlItem?.value === true) {
                      trueCount++;
                    }
                  });
                  this.dynamicForm.get(pregunta.nombre)?.setValue(trueCount);
                });

                let initialTrueCount = 0;
                controlsToWatch.forEach((controlItem: AbstractControl) => { // Corrected 'controlItem' typing
                  if (controlItem?.value === true) {
                    initialTrueCount++;
                  }
                });
                this.dynamicForm.get(pregunta.nombre)?.setValue(initialTrueCount);
              }
            }
          }
        } catch (e) {
          console.error('Error parsing function JSON or implementing logic for', pregunta.nombre, e);
        }
      }
    });
    this.isLoading = false;
  }

  getColClasses(jsonString: string): string {
    try {
      const sizes = JSON.parse(jsonString);
      let classes = '';
      if (sizes.xs) classes += `col-${sizes.xs} `;
      if (sizes.sm) classes += `col-sm-${sizes.sm} `;
      if (sizes.md) classes += `col-md-${sizes.md} `;
      if (sizes.lg) classes += `col-lg-${sizes.lg} `;
      if (sizes.xl) classes += `col-xl-${sizes.xl} `;
      return classes.trim();
    } catch (e) {
      console.error('Error parsing column classes JSON:', jsonString, e);
      return 'col-12';
    }
  }

  getOptionsForQuestion(idPregunta: number): OpcionPregunta[] {
    return this.opcionesPorPregunta.get(idPregunta) || [];
  }

  onSubmit(): void {
    if (this.dynamicForm.valid) {
      console.log('Formulario Válido. Valores:', this.dynamicForm.getRawValue());
      // Here you would typically send the data to your backend service
    } else {
      console.log('Formulario Inválido. Revisar campos.');
      this.dynamicForm.markAllAsTouched(); // Mark all fields as touched to display validation errors
    }
  }
}