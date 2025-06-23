let colaboradores = [];

const webAppUrl = 'http://localhost:3000/relay'; /*doPost v3*/

function formatarDataISO(data) {
    if (!data || data === '-') return '-';
    const d = new Date(data);
    if (isNaN(d.getTime())) return data;

    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();

    return `${dia}/${mes}/${ano}`;
}

const validadeDocumentos = {
    'EPI': 1, 'ASO': 1, 'NR06': 2, 'NR10': 2, 'NR12': 2, 'NR18': 2,
    'NR35': 2, 'PEMT': 2, 'FG': 2, 'Dallo': 2, 'CIPA': 1
};

function calcularStatusDocumento(nomeDocumento, dataEmissao) {
    if (!dataEmissao || dataEmissao === '-') return { texto: '-', classe: '' };

    const validadeAnos = validadeDocumentos[nomeDocumento];
    const data = new Date(dataEmissao);
    const dataVencimento = new Date(data);  // Cópia para não alterar a original
    dataVencimento.setFullYear(dataVencimento.getFullYear() + validadeAnos);

    const hoje = new Date();
    const diasRestantes = Math.ceil((dataVencimento - hoje) / (1000 * 60 * 60 * 24));

    let classe = '';
    let textoData = formatarDataISO(dataVencimento.toISOString());

    if (diasRestantes < 0) {
        classe = 'vencido';
        textoData += ' (Vencido)';
    } else if (diasRestantes <= 30) {
        classe = 'alerta-30';
    } else if (diasRestantes <= 60) {
        classe = 'alerta-60';
    }

    return { texto: textoData, classe: classe };
}

async function carregarColaboradores() {
    const endpoint = 'https://script.google.com/macros/s/AKfycbxadvGr5ustxgi_jxcNus9KaLykzb7qGNEMCXXy8PHxtC7NtZ8l0mA6cNvk24VNHdAC/exec'; /*doGet v2*/

    try {
        const response = await fetch(endpoint);
        colaboradores = await response.json();

        const select = document.getElementById('colaboradorSelect');
        colaboradores.forEach((colab, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = colab.Nome;
            select.appendChild(option);
        });

    } catch (error) {
        console.error('Erro ao carregar colaboradores:', error);
    }
}

function gerarCampoDocumento(nomeDocumento, valorData) {
    const status = calcularStatusDocumento(nomeDocumento, valorData);
    const dataEmissaoFormatada = formatarDataISO(valorData);

    return `<div class="field">
        <label>${nomeDocumento}:</label>
        <span data-doc="${nomeDocumento}" data-emissao="${valorData}" class="${status.classe}">
            Emissão: ${dataEmissaoFormatada} | Venc: ${status.texto}
        </span>
    </div>`;
}

function mostrarColaborador() {
    const selectedIndex = document.getElementById('colaboradorSelect').value;
    const detalhesDiv = document.getElementById('detalhesColaborador');

    if (selectedIndex === "") {
        detalhesDiv.style.display = 'none';
        return;
    }

    const colab = colaboradores[selectedIndex];
    detalhesDiv.innerHTML = `
        <div class="field"><label>Nome:</label><span>${colab.Nome}</span></div>
        <div class="field"><label>Empresa:</label><span>${colab.Empresa}</span></div>
        <div class="field"><label>Situação:</label>
            <span class="${colab["Situação"].trim().toLowerCase() === 'ativo' ? 'status-ativo' : 'status-inativo'}">
                ${colab["Situação"]}
            </span>
        </div>

        ${gerarCampoDocumento('EPI', colab.EPI)}
        ${gerarCampoDocumento('ASO', colab.ASO)}
        ${gerarCampoDocumento('NR06', colab.NR06)}
        ${gerarCampoDocumento('NR10', colab.NR10)}
        ${gerarCampoDocumento('NR12', colab.NR12)}
        ${gerarCampoDocumento('NR18', colab.NR18)}
        ${gerarCampoDocumento('NR35', colab.NR35)}
        ${gerarCampoDocumento('PEMT', colab.PEMT)}
        ${gerarCampoDocumento('FG', colab.FG)}
        ${gerarCampoDocumento('Dallo', colab.Dallo)}
        ${gerarCampoDocumento('CIPA', colab.CIPA)}

        <div class="legenda">
            <strong>Legenda:</strong>
            <div><span class="cor-legenda alerta-60"></span> Até 60 dias do vencimento</div>
            <div><span class="cor-legenda alerta-30"></span> Até 30 dias do vencimento</div>
            <div><span class="cor-legenda vencido"></span> Vencido</div>
        </div>

        <button id="editarBtn">Editar</button>
        <button id="salvarBtn" style="display:none;">Salvar</button>
        <button id="cancelarBtn" style="display:none;">Cancelar</button>
    `;
    detalhesDiv.style.display = 'block';

    document.getElementById('editarBtn').onclick = () => {
        const documentos = ['EPI', 'ASO', 'NR06', 'NR10', 'NR12', 'NR18', 'NR35', 'PEMT', 'FG', 'Dallo', 'CIPA'];
        documentos.forEach(doc => {
            const span = detalhesDiv.querySelector(`span[data-doc="${doc}"]`);
            if (span) {
                const dataEmissaoOriginal = span.getAttribute('data-emissao');
                if (dataEmissaoOriginal && dataEmissaoOriginal !== '-') {
                    const d = new Date(dataEmissaoOriginal);
                    const yyyyMMdd = d.toISOString().split('T')[0];
                    span.outerHTML = `<input type="date" id="input-${doc}" value="${yyyyMMdd}">`;
                } else {
                    span.outerHTML = `<input type="date" id="input-${doc}">`;
                }
            }
        });
        document.getElementById('editarBtn').style.display = 'none';
        document.getElementById('salvarBtn').style.display = 'inline-block';
        document.getElementById('cancelarBtn').style.display = 'inline-block';      
    };

    document.getElementById('salvarBtn').onclick = async () => {
        const documentos = ['EPI', 'ASO', 'NR06', 'NR10', 'NR12', 'NR18', 'NR35', 'PEMT', 'FG', 'Dallo', 'CIPA'];
        const novosDados = {};
    
        documentos.forEach(doc => {
            const input = document.getElementById(`input-${doc}`);
            if (input) {
                novosDados[doc] = input.value;
            }
        });
    
        const selectedIndex = document.getElementById('colaboradorSelect').value;
        const colab = colaboradores[selectedIndex];
    
        try {
            const response = await fetch(webAppUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: colab.Nome,
                    novosDados: novosDados
                })
            });
    
            if (response.ok) {
                alert('Alterações salvas com sucesso!');
                location.reload();
            } else {
                console.error('Erro ao salvar:', await response.text());
                alert('Erro ao salvar no servidor.');
            }
        } catch (error) {
            console.error('Erro no fetch:', error);
            alert('Falha ao comunicar com o servidor.');
        }
    };

    document.getElementById('cancelarBtn').onclick = () => {
        mostrarColaborador();
    };
}

window.onload = carregarColaboradores;