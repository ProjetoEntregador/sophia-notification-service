// Re-export do pgTable existente. Quando treatments for migrado podemos mover
// o pgTable para cá inteiro; por ora referenciamos a localização atual para
// manter as migrations e relations existentes funcionando.
export { reminders } from '../../../db/schema/reminders';
