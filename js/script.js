function calcularPerdas() {
  // Obter valores iniciais
  const txInicial = parseFloat(document.getElementById('tx').value) || 0;
  const rxInicial = parseFloat(document.getElementById('rx').value) || 0;
  const frequencia = parseFloat(document.getElementById('frequencia').value) || 0;
  const cabos = parseFloat(document.getElementById('cabos').value) || 0;
  const tipoCabo = document.getElementById('tipo-cabo').value;

  // Validar frequência
  if (frequencia < 1.9 || frequencia > 1000) {
      document.getElementById('erro-frequencia').style.display = 'block';
      return;
  } else {
      document.getElementById('erro-frequencia').style.display = 'none';
  }

  // Obter componentes selecionados
  const componentes = Array.from(document.querySelectorAll('.componente:checked')).map(input => input.value);

  // Fator de ajuste de perda por frequência e tipo de cabo (em dB/metro)
  const perdaCaboPorMetro = calcularPerdaCabo(frequencia, tipoCabo);

  // Definir perdas/ganhos dos componentes
  const perdas = {
      "dc6-tap": { tx: 6, rx: -6 },
      "dc6-livre": { tx: 2.5, rx: -2.5 },
      "dc9-tap": { tx: 9, rx: -9 },
      "dc9-livre": { tx: 1.5, rx: -1.5 },
      "dc12-tap": { tx: 12, rx: -12 },
      "dc12-livre": { tx: 0.5, rx: -0.5 },
      "dsv4": { tx: 7, rx: -7 }, // Divisor: aumenta TX, diminui RX
      "dsv3": { tx: 5, rx: -5 }, // Divisor: aumenta TX, diminui RX
      "desbalanciado": { tx: 3.5, rx: -7.5 } // Divisor desbalanceado
  };

  // Calcular perdas totais
  let perdaTotalTX = 0;
  let perdaTotalRX = 0;

  // Detalhes dos componentes
  let detalhesComponentes = [];

  componentes.forEach(componente => {
      if (perdas[componente]) {
          perdaTotalTX += perdas[componente].tx; // Somar conforme o componente
          perdaTotalRX += perdas[componente].rx; // Subtrair conforme o componente
          detalhesComponentes.push(`- ${componente}: TX ${perdas[componente].tx} dB, RX ${perdas[componente].rx} dB`);
      }
  });

  // Perdas de cabo (ajustadas pela frequência e tipo de cabo)
  const perdaCabo = cabos * perdaCaboPorMetro;
  perdaTotalTX += perdaCabo; // Cabo aumenta o TX
  perdaTotalRX -= perdaCabo; // Cabo diminui o RX

  // Calcular sinais finais
  const txFinal = txInicial + perdaTotalTX;
  const rxFinal = rxInicial + perdaTotalRX;

  // Montar detalhes da resposta
  const detalhes = `
      <strong>Detalhes:</strong>
      <ul>
          <li>Frequência: ${frequencia} MHz</li>
          <li>Tipo de Cabo: ${tipoCabo.toUpperCase()}</li>
          <li>Comprimento do Cabo: ${cabos} metros</li>
          <li>Atenuação do Cabo: ${perdaCabo.toFixed(2)} dB</li>
          <li>Impacto dos Componentes:
              <ul>
                  ${detalhesComponentes.map(item => `<li>${item}</li>`).join("")}
              </ul>
          </li>
      </ul>
  `;

  // Exibir resultado
  document.getElementById('txFinal').textContent = `TX Final: ${txFinal.toFixed(2)} dBmV`;
  document.getElementById('rxFinal').textContent = `RX Final: ${rxFinal.toFixed(2)} dBmV`;
  document.getElementById('detalhes').innerHTML = detalhes;
  document.getElementById('resultado').style.display = 'block';

  // Adicionar classe para animação
  document.getElementById('resultado').classList.add('show');
}

// Função para calcular a perda de cabo por metro com base na frequência e tipo de cabo
function calcularPerdaCabo(frequencia, tipoCabo) {
  // Atenuação típica em dB/100 metros para diferentes tipos de cabo
  const atenuacao = {
      rg6: {
          1.90: 1.90,
          55: 5.25,
          83: 6.40,
          187: 9.35,
          211: 10.00,
          250: 10.82,
          300: 11.64,
          350: 12.63,
          400: 13.61,
          450: 14.43,
          500: 15.09,
          550: 16.08,
          600: 16.73,
          750: 18.54,
          865: 20.01,
          1000: 21.49
      },
      rg11: {
          1.90: 1.25,
          55: 3.15,
          83: 3.87,
          187: 5.74,
          211: 6.23,
          250: 6.72,
          300: 7.38,
          350: 7.94,
          400: 8.53,
          450: 9.02,
          500: 9.51,
          550: 9.97,
          600: 10.43,
          750: 11.97,
          865: 13.05,
          1000: 14.27
      }
  };

  // Frequências disponíveis
  const frequenciasDisponiveis = Object.keys(atenuacao[tipoCabo]).map(Number).sort((a, b) => a - b);

  // Encontrar a frequência mais próxima
  let freqMaisProxima = frequenciasDisponiveis[0];
  for (const freq of frequenciasDisponiveis) {
      if (Math.abs(freq - frequencia) < Math.abs(freqMaisProxima - frequencia)) {
          freqMaisProxima = freq;
      }
  }

  // Obter a atenuação para a frequência mais próxima
  const atenuacaoPorMetro = atenuacao[tipoCabo][freqMaisProxima] / 100;

  return atenuacaoPorMetro;
}