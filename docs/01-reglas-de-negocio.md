# 1 · Reglas de negocio

Este documento explica **qué hace ClassVote y por qué**. Las decisiones aquí descritas
fueron tomadas con el dueño del negocio (Santi, RoninX Academy / Andreti Page LLC). Antes de
cambiarlas, confirmarlas con él.

## Contexto

RoninX Academy dicta clases en vivo por cinturón. Hay cuatro tipos de sesión:

| Tipo | Qué es | ¿Entra en ClassVote? |
|---|---|---|
| **Kata** | Masterclass puntual | No (salvo Nivel 6, ver abajo) |
| **Mondo** | Preguntas y respuestas; la agenda la deciden los alumnos | **Sí** |
| **Randori** | Práctica guiada | No |
| **Shinsa** | Revisión de proyecto | No |

**ClassVote solo cubre las clases Mondo.** Excepción: el Nivel 6 tiene un único espacio
semanal tipo Mondo aunque el informe original lo llame "Kata", así que sí entra en votación.

## Cinturones y horario

El horario es fijo y está configurado en la base de datos (tabla `cinturones`), en hora de
Ecuador (America/Guayaquil, UTC−5, sin horario de verano). No se sincroniza con el
calendario de GHL.

| Cinturón | Día | Hora | Mentor(es) | Nota |
|---|---|---|---|---|
| Nivel 0 · Blanco | — | — | — | Fuera de ClassVote (`activo = false`) |
| Nivel 1 · Amarillo | Jueves | 19:00 | Dani (semana A) / Liz-Diana (semana B) | |
| Nivel 2 · Naranja | Miércoles | 18:00 | Victor (semana A) / Ismael (semana B) | |
| Nivel 3 · Verde | Lunes | 18:00 | Harold / Fer / Sergio | Se abre todas las semanas; el mentor decide Mondo o Randori según el ciclo de 10 semanas |
| Nivel 4 · Azul | Miércoles | 19:00 | Efraím | |
| Nivel 5 · Marrón | Martes | 19:00 | David + Rafa | El mentor decide Mondo o Randori según lo votado |
| Nivel 6 · Negro | Domingo | 19:00 | Andreti | Entra en votación aunque el informe lo llame Kata |

## Ciclo semanal

Un **ciclo** es la votación de una clase concreta de un cinturón (por ejemplo, "Amarillo,
jueves 24 de septiembre").

1. **Apertura automática.** Cuando alguien entra a `/votar/<cinturón>`, o cuando corre el
   cron cada 5 minutos, se crea el ciclo de la **próxima clase** si todavía no existe. Si
   hoy es día de clase y la hora ya pasó, la próxima clase es la de la semana siguiente.
2. **Votación.** Mientras el ciclo está `votando`, los alumnos proponen temas y votan.
3. **Cierre automático a la hora de inicio de la clase.** Un cron dentro de Supabase cierra
   el ciclo a la hora exacta (con hasta 5 minutos de margen). No depende del mentor.
4. **Durante la clase**, el panel del mentor muestra por defecto la clase de hoy (aunque
   ya haya empezado), con los temas ordenados por votos.

**Reglas del mentor sobre el ciclo:**

- Puede **cerrar la votación antes** de la hora.
- Puede **reabrirla**. Una votación reabierta **ya no se cierra sola**: la cierra el mentor.
  Así se evita que el cron la vuelva a cerrar minutos después de reabrirla.
- Puede marcar el **tipo de sesión**: Mondo (Q&A) o Randori (práctica). Es informativo y
  útil para los Niveles 3 y 5.
- Puede **ocultar** temas inapropiados o duplicados. Un tema oculto deja de verse y de
  poder votarse para los alumnos; el mentor lo sigue viendo y puede volver a mostrarlo.

## Alumnos

- **No tienen cuenta.** Entran desde el enlace de su cinturón (que se publicará en el grupo
  de GHL correspondiente).
- **Pueden votar varios temas, una vez cada uno.** El voto no se puede deshacer.
- La identificación es **anónima por navegador** (un identificador aleatorio guardado en el
  navegador). Riesgo aceptado para v1: en modo incógnito o desde otro dispositivo se puede
  volver a votar. Para una votación de temas de clase se consideró aceptable.
- Al proponer un tema, el **nombre es opcional**; si no lo ponen aparece como "Anónimo".
- El tema debe tener entre 3 y 200 caracteres; el nombre, hasta 40.

## Mentores y administrador

- **Cada mentor crea su propia cuenta** (correo y contraseña) en `/mentor/registro`. Nunca
  hay cuentas compartidas ni acceso por SSO de GHL.
- Toda cuenta nueva queda **pendiente**: no ve nada hasta que el **administrador** la
  aprueba y le asigna uno o más cinturones.
- Un mentor solo puede gestionar **los cinturones que tiene asignados**.
- El **administrador** (rol `admin`, "super admin") ve y gestiona **todos** los cinturones y
  además puede: aprobar o rechazar cuentas, desactivar o reactivar mentores, asignar o quitar
  cinturones, dar o quitar el rol de admin y restablecer contraseñas.
- Un admin no puede cambiarse a sí mismo el estado ni el rol, para no quedarse sin acceso
  por error.
- Si un mentor olvida su contraseña, el admin le genera una **contraseña temporal** desde
  Administración y se la envía por un canal privado; el mentor la cambia en "Mi cuenta".
  No hay recuperación por correo (ver [problemas conocidos](05-despliegue-y-operacion.md#problemas-conocidos)).

## Riesgos aceptados para la versión 1

| Riesgo | Por qué se aceptó |
|---|---|
| Un voto por tema **por navegador**, no por persona | Los alumnos no tienen cuenta; es una votación de temas, no una elección |
| No hay límite de temas por alumno | El mentor puede ocultar spam o duplicados |
| Un tema oculto sigue visible para quien ya tenía la página abierta, hasta recargar (no puede votarlo) | La base de datos ya bloquea el voto; es solo visual |
| Sin recuperación de contraseña por correo | El servidor de correo gratuito de Supabase no envía a correos externos; el admin restablece manualmente |
| Horario fijo, no sincronizado con GHL | Suficiente para v1; cambiar el horario es una línea de SQL |

## Pendiente (fase 5)

Publicar cada URL `/votar/<cinturón>` en la pestaña Learning/Events del grupo de GHL
correspondiente, **después** de que el equipo revise y apruebe el diseño. Si se incrusta
en un iframe, verificar que el voto funcione en Safari/iPhone (el almacenamiento del
navegador puede estar bloqueado dentro de iframes de terceros).
