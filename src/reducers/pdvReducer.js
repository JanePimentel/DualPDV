const INITIAL_STATE = {
  loadingCashRegister: false,
  caixa: null,
  caixaAberto: false,

  sincronizando: false,
  loadingParcial: false,
  loadingTotal: false,
  loadingTransacao: false,
  lancamentos: [],
  conectado: false,
  transacoes: [],
  transacoesSync: [],
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case 'setCaixa':
      return { ...state, caixa: action.payload };
    case 'setCaixaAberto':
      return { ...state, caixaAberto: action.payload };
    case 'setLoading':
      return { ...state, loadingCashRegister: action.payload };

      
    case 'setLoadingTransacao':
      return { ...state, loadingTransacao: action.payload };
    case 'setConectado':
      return { ...state, conectado: action.payload };
    case 'setLoadingParcial':
      return { ...state, loadingParcial: action.payload };
    case 'setLoadingTotal':
      return { ...state, loadingTotal: action.payload };
    case 'setSincronizando':
      return { ...state, sincronizando: action.payload };
    case 'setLancamentosTesouraria':
      state.lancamentos.push(action.payload);
      return { ...state };
    case 'abrirCaixa':
      return { ...state, caixa: action.payload };
    case 'fecharCaixa':
      return { ...state, caixa: action.payload };
    case 'addTransacao':
      state.transacoes.push(action.payload);
      return { ...state };
    case 'addTransacaoSync':
      state.transacoesSync.push(action.payload);
      return { ...state };
    case 'limpaTransacaoSync':
      return { ...state, transacoesSync: [] };

    default:
      return state;
  }
};
