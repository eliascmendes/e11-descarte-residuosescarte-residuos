document.addEventListener('DOMContentLoaded', async () => {
    // Importar a configuração da API
    let API_BASE_URL;
    
    try {
        const module = await import('./config/api.js');
        API_BASE_URL = module.default;
    } catch (error) {
        console.error('Erro ao carregar configuração da API:', error);
        API_BASE_URL = 'https://ecovigia-api.onrender.com'; // Fallback
    }
    
    const mapaLoading = document.getElementById('mapa-loading');
    const btnAtualizar = document.getElementById('atualizar-mapa');
    
    // Valores padrões. Sp
    const mapa = L.map('mapa').setView([-15.77972, -47.92972], 4);
    
    // Adiciona a camada do OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapa);
    
    // Localizacao do user
    function obterLocalizacaoUsuario() {
        if (navigator.geolocation) {
            mapaLoading.style.display = 'flex';
            
            navigator.geolocation.getCurrentPosition(
                // Sucesso
                (posicao) => {
                    const lat = posicao.coords.latitude;
                    const lng = posicao.coords.longitude;
                    
                    mapa.setView([lat, lng], 13);
                    
                    const iconeUsuario = L.divIcon({
                        className: 'marcador-usuario',
                        html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
                        iconSize: [22, 22],
                        iconAnchor: [11, 11]
                    });
                    
                    L.marker([lat, lng], { icon: iconeUsuario }).addTo(mapa)
                        .bindPopup('Sua localização atual')
                        .openPopup();
                    
                    mapaLoading.style.display = 'none';
                    
                    carregarDenuncias();
                },
                // Erro
                (erro) => {
                    console.warn(`Erro ao obter localização: ${erro.message}`);
                    mapaLoading.style.display = 'none';
                    
                    carregarDenuncias();
                },
                // Opções
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        } else {
            console.warn('Navegador não suporta geolocalização');
            carregarDenuncias();
        }
    }
    
    // Array para armazenar os marcadores
    let marcadores = [];
    
    function limparMarcadores() {
        marcadores.forEach(marcador => {
            mapa.removeLayer(marcador);
        });
        marcadores = [];
    }
    
    // Função para buscar e exibir todas as denúncias
    async function carregarDenuncias() {
        try {
            mapaLoading.style.display = 'flex';
            
            limparMarcadores();
            
            const resposta = await fetch(`${API_BASE_URL}/denuncias`);
            
            if (!resposta.ok) {
                throw new Error('Falha ao buscar denúncias');
            }
            
            const denuncias = await resposta.json();
            
            if (denuncias && denuncias.length > 0) {
                // Adicionar marcadores para cada denúncia
                denuncias.forEach(denuncia => {
                    const marcador = adicionarMarcador(denuncia);
                    marcadores.push(marcador);
                });
            } else {
                console.log('Nenhuma denúncia encontrada');
                alert('Nenhuma denúncia encontrada no sistema.');
            }
        } catch (erro) {
            console.error('Erro ao carregar denúncias:', erro);
            alert('Ocorreu um erro ao carregar as denúncias. Tente novamente.');
        } finally {
            // Esconder loading
            mapaLoading.style.display = 'none';
        }
    }
    
    // Função para adicionar um marcador ao mapa
    function adicionarMarcador(denuncia) {
        let corMarcador = '#ef4444';
        
        if (denuncia.status === 'em_analise') {
            corMarcador = '#3b82f6'; 
        } else if (denuncia.status === 'resolvido') {
            corMarcador = '#22c55e'; 
        }
        
        //  ícone personalizado
        const icone = L.divIcon({
            className: 'marcador-personalizado',
            html: `<div style="background-color: ${corMarcador}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            popupAnchor: [0, -12]
        });
        
        //  marcador com o ícone personalizado
        const marcador = L.marker([denuncia.latitude, denuncia.longitude], { icon: icone }).addTo(mapa);
        
        const dataRegistro = new Date(denuncia.created_at).toLocaleDateString('pt-BR');
        
        // status para exibição
        let statusClasse = 'status-pendente';
        let statusTexto = 'Pendente';
        
        if (denuncia.status === 'em_analise') {
            statusClasse = 'status-em-analise';
            statusTexto = 'Em Análise';
        } else if (denuncia.status === 'resolvido') {
            statusClasse = 'status-resolvido';
            statusTexto = 'Resolvido';
        }
        
        // Conteúdo do popup
        let conteudoPopup = `
            <div class="popup-content">
                <h3>Denúncia #${denuncia.id}</h3>
                <p>${denuncia.descricao}</p>
                <p><strong>Local:</strong> ${denuncia.rua || 'Não informado'}, ${denuncia.cidade || 'Não informado'}</p>
                <p><strong>Data:</strong> ${dataRegistro}</p>
                <div class="status ${statusClasse}">${statusTexto}</div>
        `;
        
        // Adiciona a imagem ao popup se disponível
        if (denuncia.foto_url) {
            conteudoPopup += `<img src="${API_BASE_URL}${denuncia.foto_url}" alt="Foto da denúncia">`;
        }
        
        conteudoPopup += `</div>`;
        
        // Adiciona o popup ao marcador
        marcador.bindPopup(conteudoPopup);
        
        return marcador;
    }
    
    // Event listener para o botão de atualizar
    btnAtualizar.addEventListener('click', () => {
        obterLocalizacaoUsuario();
    });
    
    // Verifica a autenticação 
    function getToken() {
        return localStorage.getItem('token');
    }
    
    async function verificarToken() {
        const token = getToken();
        
        if (!token) {
            return false;
        }
        
        try {
            const resposta = await fetch(`${API_BASE_URL}/auth/verificar-token`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (resposta.ok) {
                return true;
            } else {
                return await tentarRenovarToken();
            }
        } catch (erro) {
            console.error('Erro ao verificar token:', erro);
            return await tentarRenovarToken();
        }
    }
    
    async function tentarRenovarToken() {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
            removeAuthTokens();
            return false;
        }
        
        try {
            const resposta = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refreshToken })
            });
            
            if (resposta.ok) {
                const dados = await resposta.json();
                localStorage.setItem('token', dados.token);
                return true;
            } else {
                return false;
            }
        } catch (erro) {
            console.error('Erro ao renovar token:', erro);
            return false;
        }
    }
    
    // Atualiza a interface baseado no estado de autenticação
    async function atualizarInterfaceUsuarioLogado() {
        const tokenValido = await verificarToken();
        const usuarioString = localStorage.getItem('usuario');
        const btnEntrar = document.getElementById('entrar');
        const divOpcoesNav = document.querySelector('.opcoes_nav'); 

        if (tokenValido && usuarioString && btnEntrar && divOpcoesNav) {
            const usuario = JSON.parse(usuarioString);
            
            btnEntrar.textContent = 'Sair';
            
            const btnEntrarClone = btnEntrar.cloneNode(true);
            btnEntrar.parentNode.replaceChild(btnEntrarClone, btnEntrar);
            
            btnEntrarClone.addEventListener('click', logout);

            let nomeUsuarioEl = document.getElementById('nome-usuario-nav');
            if (!nomeUsuarioEl) {
                nomeUsuarioEl = document.createElement('span');
                nomeUsuarioEl.id = 'nome-usuario-nav';
                nomeUsuarioEl.style.color = '#fff'; 
                nomeUsuarioEl.style.marginRight = '15px';
                divOpcoesNav.insertBefore(nomeUsuarioEl, btnEntrarClone); 
            }
            nomeUsuarioEl.textContent = `Olá, ${usuario.nome}!`;
        } else if (btnEntrar) {
            btnEntrar.textContent = 'Entrar';
            
            const btnEntrarClone = btnEntrar.cloneNode(true);
            btnEntrar.parentNode.replaceChild(btnEntrarClone, btnEntrar);
            
            btnEntrarClone.addEventListener('click', abrirModalLogin);

            let nomeUsuarioEl = document.getElementById('nome-usuario-nav');
            if (nomeUsuarioEl) {
                nomeUsuarioEl.remove();
            }
        }
    }
    
    async function logout() {
        const refreshToken = localStorage.getItem('refreshToken');
        
        try {
            if (refreshToken) {
                await fetch(`${API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ refreshToken })
                });
            }
        } catch (erro) {
            console.error('Erro ao fazer logout no servidor:', erro);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('usuario');
            alert('Você foi desconectado.');
            atualizarInterfaceUsuarioLogado();
        }
    }
    
    // modal de login (reaproveitada do main.js)
    function abrirModalLogin() {
        let modal = document.getElementById('modal-login');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-login';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-conteudo">
                    <span class="fechar">&times;</span>
                    <h2>Login</h2>
                    <form id="form-login">
                        <div class="form-grupo">
                            <label for="login-email">E-mail</label>
                            <input type="email" id="login-email" placeholder="seu@email.com" required>
                        </div>
                        <div class="form-grupo">
                            <label for="login-senha">Senha</label>
                            <input type="password" id="login-senha" required>
                        </div>
                        <button type="submit" class="btn-enviar">Entrar</button>
                    </form>
                    <div class="esqueci-senha">
                        <a href="#">Esqueci minha senha</a>
                    </div>
                </div>
            `;
            
            const style = document.createElement('style');
            style.textContent += `
                .modal {
                    display: none;
                    position: fixed;
                    z-index: 1000;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0,0,0,0.5);
                    align-items: center;
                    justify-content: center;
                }
                .modal-conteudo {
                    background-color: #fff;
                    border-radius: 8px;
                    padding: 20px;
                    width: 400px;
                    max-width: 90%;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                .fechar {
                    color: #aaa;
                    float: right;
                    font-size: 28px;
                    font-weight: bold;
                    cursor: pointer;
                }
                .fechar:hover {
                    color: #000;
                }
                .form-grupo {
                    margin-bottom: 15px;
                }
                .form-grupo label {
                    display: block;
                    margin-bottom: 5px;
                    color: #4b5563;
                }
                .form-grupo input {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #d1d5db;
                    border-radius: 4px;
                }
                .btn-enviar {
                    background-color: #22c55e;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                    width: 100%;
                }
                .esqueci-senha {
                    text-align: center;
                    margin-top: 15px;
                }
                .esqueci-senha a {
                    color: #22c55e;
                    text-decoration: none;
                    font-size: 14px;
                }
            `;
            document.head.appendChild(style);
            document.body.appendChild(modal);
            
            modal.querySelector('.fechar').addEventListener('click', () => {
                modal.style.display = 'none';
            });
            
            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
            
            modal.querySelector('#form-login').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = document.getElementById('login-email').value.trim();
                const senha = document.getElementById('login-senha').value;

                if (!email || !senha) {
                    alert('Por favor, preencha e-mail e senha.');
                    return;
                }

                try {
                    const resposta = await fetch(`${API_BASE_URL}/auth/login`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ email, senha })
                    });

                    const dados = await resposta.json();

                    if (resposta.ok) {
                        localStorage.setItem('token', dados.token);
                        localStorage.setItem('refreshToken', dados.refreshToken);
                        localStorage.setItem('usuario', JSON.stringify(dados.usuario));
                        alert('Login realizado com sucesso!');
                        modal.style.display = 'none';
                        atualizarInterfaceUsuarioLogado();
                    } else {
                        alert(`Erro no login: ${dados.erro}`);
                    }
                } catch (erro) {
                    console.error('Erro ao fazer login:', erro);
                    alert('Ocorreu um erro ao tentar fazer login. Tente novamente.');
                }
            });
        }
        
        modal.style.display = 'flex';
        setTimeout(() => {
            document.getElementById('login-email').focus();
        }, 100);
    }
    
    atualizarInterfaceUsuarioLogado();
    obterLocalizacaoUsuario();
});