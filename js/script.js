document.addEventListener("DOMContentLoaded", function() {
  atualizarValores();
  document.getElementById("btnCalcular").addEventListener("click", calcularPerdas);
});

function atualizarValores() {
  const tapElem = document.getElementById("tap");
  if (!tapElem) return;
  const selectedOption = tapElem.selectedOptions[0];
  // Exibe os valores iniciais (opcional)
  document.getElementById("txFinal").textContent = `TX Inicial: ${selectedOption.getAttribute("data-tx")} dBmV`;
  document.getElementById("rxFinal").textContent = `RX Inicial: ${selectedOption.getAttribute("data-rx")} dBmV`;
}

function calcularPerdas() {
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
  const detalhesArray = []; // Para registrar os detalhes dos cálculos

  // Obter valores dos inputs
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

  // Calcular a perda do cabo por metro com base na frequência e tipo de cabo
  const perdaPorMetro = calcularPerdaCabo(frequencia, tipoCabo);
  const perdaCabo = cabos * perdaPorMetro;
  detalhesArray.push(`<li>Perda do Cabo: ${perdaCabo.toFixed(2)} dB (${cabos} m x ${perdaPorMetro.toFixed(3)} dB/m)</li>`);

  // Aplicar a perda do cabo de acordo com a faixa de frequência:
  // TX: 5 a 85 MHz; RX: 105 a 999 MHz
  if (frequencia >= 5 && frequencia <= 85) {
    tx -= perdaCabo;
    detalhesArray.push(`<li>Perda aplicada na TX (frequência ${frequencia} MHz)</li>`);
  }
  if (frequencia >= 105 && frequencia <= 999) {
    rx -= perdaCabo;
    detalhesArray.push(`<li>Perda aplicada na RX (frequência ${frequencia} MHz)</li>`);
  }

  // Aplicar os ajustes dos componentes selecionados
  document.querySelectorAll(".componente:checked").forEach((comp) => {
    const perdas = {
      "dc6-tap": { tx: 6, rx: -6 },
      "dc6-livre": { tx: 2.5, rx: -2.5 },
      "dc9-tap": { tx: 9, rx: -9 },
      "dc9-livre": { tx: 1.5, rx: -1.5 },
      "dc12-tap": { tx: 12, rx: -12 },
      "dc12-livre": { tx: 0.5, rx: -0.5 },
      "dsv4": { tx: 7, rx: -7 }
    };
    const ajuste = perdas[comp.value];
    if (ajuste) {
      tx += ajuste.tx;
      rx += ajuste.rx;
      detalhesArray.push(`<li>${comp.value} ajusta TX em ${ajuste.tx} dB e RX em ${ajuste.rx} dB</li>`);
    }
  });

  // Exibir os resultados finais
  document.getElementById("resultado").style.display = "block";
  document.getElementById("txFinal").textContent = `TX Final: ${tx.toFixed(2)} dBmV`;
  document.getElementById("rxFinal").textContent = `RX Final: ${rx.toFixed(2)} dBmV`;

  // Verificar se os valores estão fora da faixa válida e ajustar a cor para vermelho se necessário
  if (tx < 38 || tx > 51) {
    document.getElementById("txFinal").style.color = "red";
    detalhesArray.push(`<li style="color:red;">TX fora da faixa válida (38 a 51 dBmV)</li>`);
  } else {
    document.getElementById("txFinal").style.color = "black";
  }
  
  if (rx < -12 || rx > 12) {
    document.getElementById("rxFinal").style.color = "red";
    detalhesArray.push(`<li style="color:red;">RX fora da faixa válida (-12 a 12 dBmV)</li>`);
  } else {
    document.getElementById("rxFinal").style.color = "black";
  }

  // Exibir os detalhes do cálculo
  document.getElementById("detalhes").innerHTML = `<strong>Detalhes do Cálculo:</strong><ul>${detalhesArray.join('')}</ul>`;

  // Log para depuração
  console.log("Resultados:", { tx, rx, perdaCabo, detalhes: detalhesArray });
}

// Função para calcular a perda do cabo por metro com base na frequência e tipo de cabo
function calcularPerdaCabo(frequencia, tipoCabo) {
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
  // Retorna a atenuação por metro (dB/metro)
  return atenuacao[tipoCabo][freqMaisProxima] / 100;
}
