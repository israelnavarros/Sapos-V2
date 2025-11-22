// Define a URL base da API usando a variável de ambiente do Vite.
// Se a variável não estiver definida (em desenvolvimento local), usa 'http://localhost:5000'.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default API_URL;