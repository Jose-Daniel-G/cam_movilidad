// src/app/services/formulario.service.ts

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

  constructor(private http: HttpClient) {}

  // MODIFICADO: Tipo de retorno específico
  obtenerOpcionesPregunta(payload: { idFormulario: number; idPregunta: number }): Observable<ApiResponse> {
    const headers = new HttpHeaders({
      'X-Auth': '0bcdb907-faa1-4e12-a4af-481ff3ca4676',
      'Content-Type': 'application/json',
    });
    return this.http.post<ApiResponse>(this.apiUrlOpcionesPregunta, payload, { headers });
  }

  getFormularioCompleto(idFormulario: number): Observable<ApiResponse> {
    const headers = new HttpHeaders({
      'X-Auth': '0bcdb907-faa1-4e12-a4af-481ff3ca4676',
      'Content-Type': 'application/json',
    });
    const payload = { idFormulario: idFormulario };

    return this.http.post<ApiResponse>(this.apiUrlFormularioCompleto, payload, { headers });
  }
}