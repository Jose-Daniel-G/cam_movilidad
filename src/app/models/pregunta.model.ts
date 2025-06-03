export interface Pregunta {
  nombre: string;
  descripcion: string; // This can serve as placeholder
  requerido: 'SI' | 'NO';
  tipo: 'CHEQUEO' | 'TEXTO' | 'NUMERICO' | 'LISTA' | 'DIRECCION' | 'CORREO' | 'PLACA' | 'CALCULATED_WEBSERVICE' | 'OCULTO' | 'DINEROSR' | 'CODIGOBARRAS' | 'FORMULARIO_ID' | 'FECHA' | 'HORA'; // Added FECHA, HORA. Your JSON had 'CHEQUEO' not 'BOOLEANO'
  etiqueta: string; // This is what you were using as 'label'
  sololectura?: 'SI' | 'NO';
  funcion?: string; // JSON string
  ayuda?: string; // JSON string (used for column layout or hints)
  limiteCaracteres?: number;
  longitud: string; // JSON string
  pdfX?: number;
  pdfY?: number;
  imprimir?: 'SI' | 'NO';
  idPregunta: number;
  idFormulario: number;
  valorDefecto?: string; // from your TS, might be in JSON
}

export interface FormularioData {
  preguntas: Pregunta[];
  idFormulario: number;
  nombre: string; // FIX: Changed from 'nombreFormulario' to 'nombre' to match your JSON
  descripcion: string;
  idPreguntaTotal: number;
  idPreguntaIdentificacion: number;
  nroInicial: number;
  nombreSecuencia: string;
  publico: string;
  pagoenlinea: string;
  codigoRenta: string;
  codigoServicio: string;
  ean: string;
}

export interface ApiResponse {
  result: string;
  data: FormularioData | OpcionPregunta[] | any;
}

export interface OpcionPregunta {
  etiqueta: string; // This is what you were using as 'texto'
  idOpcion: number; // This is what you were using as 'valor'
  idPregunta: number;
  idFormulario: number;
}