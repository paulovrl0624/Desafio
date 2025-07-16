import axios from 'axios';

const BASE_URL = 'https://transparencia.ma.gov.br/api';

export const fetchUnits = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/consulta-unidades`);
    return response.data;
  } catch (error) {
    console.error("Erro na API de unidades:", error);
    // Propaga o erro para ser tratado no componente que chama
    throw new Error("Erro ao carregar as unidades. Tente novamente mais tarde.");
  }
};

export const fetchExpenses = async (unitCode, year, month) => {
  const parsedYear = parseInt(year, 10);
  const parsedMonth = parseInt(month, 10);

  if (isNaN(parsedYear) || isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
    throw new Error("Por favor, insira um ano e um mês válidos para ver as despesas da unidade.");
  }

  const params = {
    codigo_ug: unitCode,
    ano: parsedYear,
    mes: parsedMonth,
  };

  try {
    const response = await axios.get(`${BASE_URL}/consulta-despesas`, {
      params: params
    });
    return response.data;
  } catch (error) {
    console.error("Erro na API de despesas:", error);
    // Propaga o erro para ser tratado no componente que chama
    throw new Error("Erro ao carregar despesas para a unidade. Verifique os filtros de data ou sua conexão.");
  } //
}; //