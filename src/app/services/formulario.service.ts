import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse, FormularioData, Pregunta, OpcionPregunta } from '../models/pregunta.model'; // Importa OpcionPregunta

@Injectable({
  providedIn: 'root',
})
export class FormularioService {
  private apiUrlOpcionesPregunta = 'https://servicios.cali.gov.co:9090/PortalApp/rest/api/Pregunta/getOpcionPregunta';
  private apiUrlFormularioCompleto = 'https://servicios.cali.gov.co:9090/PortalApp/rest/api/Formulario/getFormularioComplete';


  // MODIFICADO: Tipo de retorno específico
  private headers = new HttpHeaders({
    'X-Auth': '0bcdb907-faa1-4e12-a4af-481ff3ca4676',
    'Content-Type': 'application/json',
  });
  
  constructor(private http: HttpClient) {}

  obtenerOpcionesPregunta(payload: { idFormulario: number; idPregunta: number }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(this.apiUrlOpcionesPregunta, payload, { headers: this.headers });
  }

  getFormularioCompleto(idFormulario: number): Observable<ApiResponse> {
    const payload = { idFormulario };
      return this.http.post<ApiResponse>(this.apiUrlFormularioCompleto, payload, { headers: this.headers });
  }
}