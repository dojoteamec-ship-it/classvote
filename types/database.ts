// Tipos escritos a mano a partir de migrations/0001_init.sql.
// Reemplazar por `supabase gen types typescript --linked > types/database.ts`
// cuando el CLI esté enlazado al proyecto.

export type SesionTipo = "qa" | "practica";
export type CicloEstado = "votando" | "cerrado";
export type MentorEstado = "pendiente" | "activo" | "inactivo";
export type MentorRol = "mentor" | "admin";

export type Cinturon = {
  id: string;
  nombre: string;
  orden: number;
  slug: string;
  dia_semana: number | null;
  hora_local: string | null;
  activo: boolean;
};

export type Mentor = {
  id: string;
  nombre: string;
  email: string;
  auth_user_id: string | null;
  estado: MentorEstado;
  rol: MentorRol;
  creado_en: string;
};

export type MentorCinturon = {
  mentor_id: string;
  cinturon_id: string;
};

export type CicloSemanal = {
  id: string;
  cinturon_id: string;
  fecha_clase: string;
  estado: CicloEstado;
  tipo_sesion: SesionTipo | null;
  cerrado_en: string | null;
  /** true si un mentor la reabrió: el cierre automático ya no la toca. */
  reabierto: boolean;
};

export type Tema = {
  id: string;
  ciclo_id: string;
  texto: string;
  alumno_alias: string | null;
  votos_count: number;
  /** Solo lo pide el panel del mentor. */
  oculto?: boolean;
  creado_en: string;
};

export type Voto = {
  id: string;
  tema_id: string;
  alumno_fingerprint: string;
  creado_en: string;
};
