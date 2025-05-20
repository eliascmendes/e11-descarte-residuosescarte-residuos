document.addEventListener('DOMContentLoaded', async () => {
    let API_BASE_URL;
    try {
        const module = await import('./config/api.js');
        API_BASE_URL = module.default;
    } catch (error) {
        console.error('Erro ao carregar configuração da API:', error);
        API_BASE_URL = 'https://ecovigia-api-ssvv.onrender.com'; 
    }
    
    // Verificar autenticação antes de permitir acesso à página
    async function verificarToken() {
        const token = localStorage.getItem('token');
        
        if (!token) {
            return false;
        }
        
        try {
            const resposta = await fetch(`${API_BASE_URL}/auth/verificar-token`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            return resposta.ok;
        } catch (erro) {
            console.error('Erro ao verificar token:', erro);
            return false;
        }
    }

    const autenticado = await verificarToken();
    if (!autenticado) {
        alert('Você precisa estar logado para acessar esta página.');
        window.location.href = '../index.html';
        return;
    }

    let mapa = L.map('mapa').setView([-2.52948434846992, -44.305960766737535], 13);
    let marcador;
    let coordenadas = {};
    const mapaLoading = document.getElementById('mapa-loading');

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapa);

    function obterLocalizacaoUsuario() {
        if (navigator.geolocation) {
            if (mapaLoading) mapaLoading.style.display = 'flex';
            
            navigator.geolocation.getCurrentPosition(
                // Sucesso
                (posicao) => {
                    const lat = posicao.coords.latitude;
                    const lng = posicao.coords.longitude;
                    
                    mapa.setView([lat, lng], 15);
                    
                    if (marcador) {
                        mapa.removeLayer(marcador);
                    }
                    
                    const iconeUsuario = L.divIcon({
                        className: 'marcador-usuario',
                        html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
                        iconSize: [22, 22],
                        iconAnchor: [11, 11]
                    });
                    
                    marcador = L.marker([lat, lng], { icon: iconeUsuario }).addTo(mapa);
                    coordenadas = {
                        latitude: lat,
                        longitude: lng
                    };
                    
                    // Buscar informações do endereço pela API
                    buscarEndereco(lat, lng);
                    
                    if (mapaLoading) mapaLoading.style.display = 'none';
                },
                // Erro
                (erro) => {
                    console.warn(`Erro ao obter localização: ${erro.message}`);
                    alert('Não foi possível obter sua localização. Por favor, selecione o local no mapa.');
                    if (mapaLoading) mapaLoading.style.display = 'none';
                },
                // Opções
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        } else {
            alert('Seu navegador não suporta geolocalização. Por favor, selecione o local no mapa.');
        }
    }

    // Função para buscar endereço via API
    function buscarEndereco(lat, lng) {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
            .then(response => response.json())
            .then(data => {
                const address = data.address;
                
                document.getElementById('endereco').textContent = 
                    address.road || address.pedestrian || 'Endereço não disponível';
                document.getElementById('cidade').textContent = 
                    address.city || address.town || address.village || 'Não disponível';
                document.getElementById('cep').textContent = 
                    address.postcode || 'Não disponível';
                
                const bairro = address.suburb || address.neighbourhood || address.residential || '';
                document.getElementById('endereco').dataset.bairro = bairro;
            })
            .catch(err => {
                console.error('Erro ao obter endereço:', err);
                document.getElementById('endereco').textContent = 'Erro ao obter endereço';
            });
    }

    const btnLocalizacao = document.getElementById('obter-localizacao');
    if (btnLocalizacao) {
        btnLocalizacao.addEventListener('click', obterLocalizacaoUsuario);
    }

    mapa.on('click', function(e) {
        if (marcador) {
            mapa.removeLayer(marcador);
        }
        
        marcador = L.marker(e.latlng).addTo(mapa);
        coordenadas = {
            latitude: e.latlng.lat,
            longitude: e.latlng.lng
        };
        
        // Buscar informações do endereço
        buscarEndereco(e.latlng.lat, e.latlng.lng);
    });

    // Configuração do upload de fotos
    const uploadArea = document.getElementById('upload-area');
    const fotoInput = document.getElementById('foto-input');
    const fotoPreview = document.getElementById('foto-preview');
    const fotoPreviewContainer = document.getElementById('foto-preview-container');
    
    uploadArea.addEventListener('click', () => {
        fotoInput.click();
    });
    
    fotoInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                fotoPreview.src = e.target.result;
                fotoPreviewContainer.style.display = 'block';
                uploadArea.style.display = 'none';
            };
            
            reader.readAsDataURL(this.files[0]);
        }
    });
    
    // Envio do formulário
    document.getElementById('enviar-denuncia').addEventListener('click', async function(e) {
        e.preventDefault();
        
        const descricao = document.getElementById('descricao').value;
        
        if (!descricao) {
            alert('Por favor, descreva o problema encontrado.');
            return;
        }
        
        if (!coordenadas.latitude || !coordenadas.longitude) {
            alert('Por favor, selecione um local no mapa ou use sua localização atual.');
            return;
        }
        
        // Criar FormData para enviar arquivo e dados
        const formData = new FormData();
        formData.append('latitude', coordenadas.latitude);
        formData.append('longitude', coordenadas.longitude);
        formData.append('descricao', descricao);
        formData.append('cidade', document.getElementById('cidade').textContent);
        formData.append('cep', document.getElementById('cep').textContent);
        formData.append('rua', document.getElementById('endereco').textContent);
        
        // Adicionar bairro ao formData
        const bairro = document.getElementById('endereco').dataset.bairro || '';
        formData.append('bairro', bairro);
        
        // foto se existir
        if (fotoInput.files.length > 0) {
            formData.append('foto', fotoInput.files[0]);
        }
        
        // Enviar dados para o servidor com autenticação
        try {
            const token = localStorage.getItem('token');
            const resposta = await fetch(`${API_BASE_URL}/denuncias`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            const dados = await resposta.json();
            
            if (resposta.ok) {
                alert('Denúncia registrada com sucesso!');
                window.location.href = '../index.html';
            } else {
                alert(`Erro: ${dados.erro}`);
            }
        } catch (erro) {
            console.error('Erro:', erro);
            alert('Ocorreu um erro ao enviar a denúncia. Tente novamente.');
        }
    });
}); 