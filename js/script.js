// Aguarda o carregamento completo do DOM e inicializa os eventos
document.addEventListener("DOMContentLoaded", () => {
  atualizarValores();
  document.getElementById("btnCalcular").addEventListener("click", calcularPerdas);
});

// Atualiza os valores iniciais (TX e RX) com base no TAP selecionado
const atualizarValores = () => {
  const tapElem = document.getElementById("tap");
  if (!tapElem) return;
  const selectedOption = tapElem.selectedOptions[0];
  if (!selectedOption) return;
  document.getElementById("txFinal").textContent = `TX Inicial: ${selectedOption.getAttribute("data-tx")} dBmV`;
  document.getElementById("rxFinal").textContent = `RX Inicial: ${selectedOption.getAttribute("data-rx")} dBmV`;
};

// Função principal para calcular as perdas
const calcularPerdas = () => {
  const tapElem = document.getElementById("tap");
  if (!tapElem) {
    console.error("Elemento #tap não encontrado!");
    return;
  }
  const selectedOption = tapElem.selectedOptions[0];
  if (!selectedOption) {
    console.error("Nenhuma opção selecionada no TAP!");
    return;
  }
  
  // Valores iniciais do TAP
  let tx = parseFloat(selectedOption.getAttribute("data-tx"));
  let rx = parseFloat(selectedOption.getAttribute("data-rx"));
  const detalhesArray = []; // Armazena os detalhes do cálculo
  
  // Captura dos inputs do usuário
  const frequencia = parseFloat(document.getElementById("frequencia").value);
  const cabos = parseFloat(document.getElementById("cabos").value);
  const tipoCabo = document.getElementById("tipo-cabo").value;
  
  // Validação da frequência
  if (isNaN(frequencia) || frequencia < 5 || frequencia > 999) {
    document.getElementById("erro-frequencia").style.display = "block";
    return;
  } else {
    document.getElementById("erro-frequencia").style.display = "none";
  }
  
  // Cálculo da perda do cabo (dB/m) multiplicada pelo comprimento
  const perdaPorMetro = calcularPerdaCabo(frequencia, tipoCabo);
  const perdaCabo = cabos * perdaPorMetro;
  detalhesArray.push(`Perda do Cabo: ${perdaCabo.toFixed(2)} dB (${cabos} m x ${perdaPorMetro.toFixed(3)} dB/m)`);
  
  // Aplicação da perda do cabo conforme a faixa de frequência
  if (frequencia >= 5 && frequencia <= 85) {
    tx -= perdaCabo;
    detalhesArray.push(`Perda aplicada na TX (frequência ${frequencia} MHz)`);
  }
  if (frequencia >= 105 && frequencia <= 999) {
    rx -= perdaCabo;
    detalhesArray.push(`Perda aplicada na RX (frequência ${frequencia} MHz)`);
  }
  
  // Ajustes dos componentes selecionados
  const ajustes = {
    "dc6-tap": { tx: 6, rx: -6 },
    "dc6-livre": { tx: 2.5, rx: -2.5 },
    "dc9-tap": { tx: 9, rx: -9 },
    "dc9-livre": { tx: 1.5, rx: -1.5 },
    "dc12-tap": { tx: 12, rx: -12 },
    "dc12-livre": { tx: 0.5, rx: -0.5 },
    "dsv4": { tx: 7, rx: -7 },
    "dsv3": { tx: 5, rx: -5 },
    "dsv2": { tx: 3.5, rx: -3.5 }
  };
  
  document.querySelectorAll(".componente:checked").forEach(comp => {
    const ajuste = ajustes[comp.value];
    if (ajuste) {
      tx += ajuste.tx;
      rx += ajuste.rx;
      detalhesArray.push(`${comp.value} ajusta TX em ${ajuste.tx} dB e RX em ${ajuste.rx} dB`);
    }
  });
  
  // Verificação das faixas válidas e alteração da cor dos textos
  // Se estiver dentro do padrão, o texto fica verde; caso contrário, fica vermelho.
  if (tx < 38 || tx > 51) {
    document.getElementById("txFinal").style.color = "red";
    detalhesArray.push("TX fora da faixa válida (38 a 51 dBmV)");
  } else {
    document.getElementById("txFinal").style.color = "green";
  }
  
  if (rx < -12 || rx > 12) {
    document.getElementById("rxFinal").style.color = "red";
    detalhesArray.push("RX fora da faixa válida (-12 a 12 dBmV)");
  } else {
    document.getElementById("rxFinal").style.color = "green";
  }
  
  // Atualiza a interface com os resultados e detalhes
  document.getElementById("resultado").style.display = "block";
  document.getElementById("txFinal").textContent = `TX Final: ${tx.toFixed(2)} dBmV`;
  document.getElementById("rxFinal").textContent = `RX Final: ${rx.toFixed(2)} dBmV`;
  document.getElementById("detalhes").innerHTML = `<strong>Detalhes do Cálculo:</strong><ul>${detalhesArray.map(item => `<li>${item}</li>`).join('')}</ul>`;
  
  // Define a animação com base na verificação das faixas válidas
  const animationElem = document.getElementById("animation");
  if (tx >= 38 && tx <= 51 && rx >= -12 && rx <= 12) {
    // Sinal dentro do padrão: animação feliz
    animationElem.innerHTML = "😄";
    animationElem.className = "happy";
  } else {
    // Sinal fora do padrão: animação triste
    animationElem.innerHTML = "😢";
    animationElem.className = "sad";
  }
  
  console.log("Resultados:", { tx, rx, perdaCabo, detalhes: detalhesArray });
};

// Função que calcula a atenuação por metro (dB/m) para o cabo com base na frequência e tipo de cabo
const calcularPerdaCabo = (frequencia, tipoCabo) => {
  const atenuacao = {
    rg6: {
      5: 1.9,
      55: 5.25,
      85: 6.4,
      200: 10,
      300: 11.64,
      500: 15.09,
      750: 18.54,
      1000: 21.49
    },
    rg11: {
      5: 1.25,
      55: 3.15,
      85: 3.87,
      200: 6.23,
      300: 7.38,
      500: 9.51,
      750: 11.97,
      1000: 14.27
    }
  };
  
  const freqArray = Object.keys(atenuacao[tipoCabo]).map(Number).sort((a, b) => a - b);
  let freqMaisProxima = freqArray[0];
  for (const f of freqArray) {
    if (Math.abs(f - frequencia) < Math.abs(freqMaisProxima - frequencia)) {
      freqMaisProxima = f;
    }
  }
  // Converte o valor de dB/100m para dB/m
  return atenuacao[tipoCabo][freqMaisProxima] / 100;
};
