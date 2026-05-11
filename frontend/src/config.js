// Define a URL base da API usando a variável de ambiente do Vite.
// Em produção (Vercel), deixa vazio para usar o proxy reverso e evitar bloqueio no Safari. Em local, usa localhost.
const API_URL = import.meta.env.MODE === 'production' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');

export default API_URL;