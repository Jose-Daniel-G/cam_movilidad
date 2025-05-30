import { Routes } from '@angular/router';
import { DynamicFormComponent } from './components/dynamic-form/dynamic-form.component';

export const routes: Routes = [
  {
    path: 'formulario/:idFormulario', // La ruta con un parámetro para el ID del formulario
    component: DynamicFormComponent,
  },
];
