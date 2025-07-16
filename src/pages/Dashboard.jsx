import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios'; // Mantenha axios aqui, ou você pode tirá-lo se a sua api.js for a única a usá-lo.
import './Dashboard.css';

// Importa as funções de API do novo arquivo de serviço
import { fetchUnits, fetchExpenses } from "../services/api";

const Dashboard = () => {
  // --- Component States ---
  const [units, setUnits] = useState([]); // All units fetched initially
  const [filteredUnits, setFilteredUnits] = useState([]); // Units displayed in the table (filtered by search term ONLY)
  
  const [totalGastos, setTotalGastos] = useState(0);
  const [quantidadeOrgaos, setQuantidadeOrgaos] = useState(0); // Renomeado para seguir o Figma
  const [licitacoes, setLicitacoes] = useState(0);

  const [loadingUnits, setLoadingUnits] = useState(true); // For initial units loading
  const [loadingExpenses, setLoadingExpenses] = useState(false); // For specific unit expenses

  const [expenses, setExpenses] = useState([]); // Expenses of the selected unit
  const [selectedUnit, setSelectedUnit] = useState(null); // The unit currently clicked/selected

  const [searchTermUnit, setSearchTermUnit] = useState(''); // Filter for units table (by code/name)

  // Filters for Year and Month (defaulting to empty strings) - These now ONLY affect expense details
  const [filterYearInput, setFilterYearInput] = useState('');
  const [filterMonthInput, setFilterMonthInput] = useState('');

  const [error, setError] = useState(null); // Usado para mensagens de erro, como em image_26c99a.png

  // --- Function to fetch all units (runs once on mount) ---
  useEffect(() => {
    const fetchAllUnits = async () => {
      setLoadingUnits(true);
      setError(null);
      try {
        // Usa a função fetchUnits do seu arquivo de serviço
        const unidades = await fetchUnits(); 
        if (Array.isArray(unidades) && unidades.length > 0) {
          setUnits(unidades); // Store all units
          setFilteredUnits(unidades); // Initially, display all units
        } else {
          setUnits([]);
          setFilteredUnits([]);
          setError("Nenhuma unidade encontrada na API. Verifique a URL ou a conexão.");
        }
      } catch (err) {
        console.error("Erro ao obter unidades:", err);
        setError(err.message); // Usa a mensagem de erro propagada do serviço
      } finally {
        setLoadingUnits(false);
      }
    };
    fetchAllUnits();
  }, []); // Empty dependency array means it runs only once on mount

  // --- Effect to filter units in the table (based on searchTermUnit ONLY) ---
  useEffect(() => {
    const currentFiltered = units.filter(unit =>
      unit.nome_amigavel.toLowerCase().includes(searchTermUnit.toLowerCase()) ||
      unit.codigo_unidade.toLowerCase().includes(searchTermUnit.toLowerCase())
    );
    setFilteredUnits(currentFiltered);
  }, [searchTermUnit, units]); // Depends only on searchTermUnit and the master units list

  // --- Function to fetch expenses for a specific unit (triggered ONLY by unit click) ---
  const fetchExpensesForUnit = useCallback(async (unitCode, year, month) => {
    setLoadingExpenses(true);
    setError(null); // Clear previous errors

    try {
      // Usa a função fetchExpenses do seu arquivo de serviço
      const data = await fetchExpenses(unitCode, year, month);

      if (data && Array.isArray(data) && data.length > 0) {
        setExpenses(data);

        const totalGastosCalculado = data.reduce((acc, curr) => {
          const valor = parseFloat(curr.valor);
          return isNaN(valor) ? acc : acc + valor;
        }, 0);

        const quantidadeItens = data.length; // This is the count of individual expense items

        const totalLicitacoes = data.reduce((acc, curr) => {
          const licitacoesValue = parseInt(curr.licitacoes || '0', 10); // Use '0' if licitacoes is null/undefined
          return isNaN(licitacoesValue) ? acc : acc + licitacoesValue;
        }, 0);

        setTotalGastos(totalGastosCalculado);
        setQuantidadeOrgaos(quantidadeItens); // Set the count of expense items here, para o rótulo "Quantidade de Órgãos" como no Figma.
        setLicitacoes(totalLicitacoes);

      } else {
        setExpenses([]);
        setTotalGastos(0);
        setQuantidadeOrgaos(0);
        setLicitacoes(0);
        setError(`Nenhuma despesa encontrada para esta unidade no período ${month}/${year}.`);
      }
    } catch (err) {
      console.error("Erro ao carregar as despesas para a unidade:", err);
      setError(err.message); // Usa a mensagem de erro propagada do serviço
      setExpenses([]);
      setTotalGastos(0);
      setQuantidadeOrgaos(0);
      setLicitacoes(0);
    } finally {
      setLoadingExpenses(false);
    }
  }, []); // Dependencies for this useCallback: now empty, as filterYearInput/MonthInput are passed as args

  // --- Function called when a user clicks a unit in the table ---
  const handleUnitClick = (unit) => {
    if (selectedUnit && selectedUnit.codigo_unidade === unit.codigo_unidade) {
      // If the same unit is clicked, deselect it and clear all expense-related data.
      setSelectedUnit(null);
      setExpenses([]);
      setTotalGastos(0);
      setQuantidadeOrgaos(0);
      setLicitacoes(0);
      setError(null);
    } else {
      // Select the new unit and fetch its expenses using the CURRENT year/month filters
      setSelectedUnit(unit);
      // Pass the current filter values directly
      fetchExpensesForUnit(unit.codigo_unidade, filterYearInput, filterMonthInput);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="header">
        <h1>Portal da Transparência do Maranhão</h1>
        <div className="filters">
          {/* Filter by Year - NOW ONLY AFFECTS EXPENSES ON UNIT CLICK */}
          <input
            type="text"
            placeholder="Ano (ex: 2023)"
            value={filterYearInput}
            onChange={(e) => {
                setFilterYearInput(e.target.value);
                // Clear selected unit and expense data when date filters change
                setSelectedUnit(null); 
                setExpenses([]); 
                setTotalGastos(0); 
                setQuantidadeOrgaos(0);
                setLicitacoes(0);
                setError(null); 
            }}
            className="filter-input-text"
          />
          {/* Filter by Month - NOW ONLY AFFECTS EXPENSES ON UNIT CLICK */}
          <input
            type="text"
            placeholder="Mês (ex: 1)"
            value={filterMonthInput}
            onChange={(e) => {
                setFilterMonthInput(e.target.value);
                setSelectedUnit(null);
                setExpenses([]);
                setTotalGastos(0);
                setQuantidadeOrgaos(0);
                setLicitacoes(0);
                setError(null);
            }}
            className="filter-input-text"
          />
          {/* Filter by Unit Code (for the units table, independent of date filters) */}
          <input
            type="text"
            placeholder="Pesquisar por código/nome da unidade"
            value={searchTermUnit}
            onChange={(e) => setSearchTermUnit(e.target.value)}
            className="filter-input-text"
          />
        </div>
      </div>

      {/* Summary Section - Will show zeros until a unit is clicked */}
      <div className="summary">
        <div className="summary-box">
          <h3>Total de Gastos {selectedUnit && filterYearInput && filterMonthInput ? `( ${filterMonthInput}/${filterYearInput})` : ''}</h3>
          <p>R$ {loadingExpenses && selectedUnit ? '...' : totalGastos.toFixed(2)}</p> 
        </div>
        <div className="summary-box">
          {/* O rótulo é "Quantidade de Órgãos" como no Figma, mas o valor é a contagem de itens de despesa da unidade selecionada */}
          <h3>Quantidade de Órgãos</h3> 
          <p>{loadingExpenses && selectedUnit ? '...' : quantidadeOrgaos}</p> 
        </div>
        <div className="summary-box">
          <h3>Licitações</h3>
          <p>{loadingExpenses && selectedUnit ? '...' : licitacoes}</p>
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}

      {/* Units Table - Always shows all units, filtered only by searchTermUnit */}
      <div className="units-table">
        <h2>Unidades</h2>
        {loadingUnits ? ( 
          <p>Carregando unidades...</p>
        ) : filteredUnits.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Órgão</th>
                <th>Código</th>
                <th>Sigla</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnits.map((unit) => (
                <tr
                  key={unit.codigo_unidade}
                  onClick={() => handleUnitClick(unit)}
                  className={selectedUnit?.codigo_unidade === unit.codigo_unidade ? 'selected-row' : ''}
                >
                  <td>{unit.nome_amigavel}</td>
                  <td>{unit.codigo_unidade}</td>
                  <td>{unit.sigla_proposta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Nenhuma unidade encontrada com o termo de pesquisa.</p>
        )}
      </div>

      {/* Detailed Expenses Section (appears ONLY when a unit is clicked) */}
      {selectedUnit && ( // Renders only if a unit is selected
        <div className="expenses-section">
          <h2>Despesas detalhadas para: {selectedUnit.nome_amigavel} (Ano: {filterYearInput} / Mês: {filterMonthInput})</h2>
          {loadingExpenses ? (
            <p>Carregando despesas da unidade...</p>
          ) : expenses.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense, index) => (
                  <tr key={expense.id_lancamento_despesa || index}>
                    <td>{expense.descricao}</td>
                    <td>R$ {parseFloat(expense.valor).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Nenhuma despesa detalhada encontrada para esta unidade no período selecionado ({filterMonthInput}/{filterYearInput}). Tente outros filtros de data.</p>
          )}
        </div>
      )}
    </div>
  ); //
}; //

export default Dashboard; //