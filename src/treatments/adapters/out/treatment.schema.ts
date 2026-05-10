// Re-export do pgTable. Quando todas as features estiverem migradas, podemos
// mover o pgTable para cá inteiro; por ora referenciamos a localização existente
// para manter migrations e relations atuais funcionando.
export { treatments } from '../../../db/schema/treatments';
