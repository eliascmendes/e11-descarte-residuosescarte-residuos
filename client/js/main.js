document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('nav a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const id = link.getAttribute('href');
            document.querySelector(id).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    const btnEntrar = document.getElementById('entrar');
    if (btnEntrar) {
        if (!getToken()) {
            const btnEntrarClone = btnEntrar.cloneNode(true);
            btnEntrar.parentNode.replaceChild(btnEntrarClone, btnEntrar);
            
            btnEntrarClone.addEventListener('click', (e) => {
                e.preventDefault();
                abrirModalLogin();
            });
        }
    }

    const btnDenunciar = document.querySelector('#tela1 button');
    if (btnDenunciar) {
        btnDenunciar.addEventListener('click', () => {
            // Redirecionar para a seção de funcionalidades (por enquanto)
            const funcionalidadesSection = document.getElementById('tela3');
            if (funcionalidadesSection) {
                funcionalidadesSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // Validação do formulário de cadastro
    const formCadastro = document.querySelector('.cadastro-form form');
    if (formCadastro) {
        formCadastro.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const nome = document.getElementById('nome').value.trim();
            const email = document.getElementById('email').value.trim();
            const senha = document.getElementById('senha').value;
            
            let isValid = true;
            let mensagemErro = '';
            
            if (nome === '') {
                isValid = false;
                mensagemErro = 'Por favor, insira seu nome completo.';
            } 
            else if (email === '' || !validarEmail(email)) {
                isValid = false;
                mensagemErro = 'Por favor, insira um email válido.';
            } 
            else if (senha === '' || senha.length < 6) {
                isValid = false;
                mensagemErro = 'A senha deve ter pelo menos 6 caracteres.';
            }
            
            if (isValid) {
                try {
                    const resposta = await fetch('http://localhost:3000/usuarios', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ nome, email, senha })
                    });
                    
                    const dados = await resposta.json();
                    
                    if (resposta.ok) {
                        alert('Cadastro realizado com sucesso! Faça login para continuar.');
                        formCadastro.reset();
                        
                        // Abrir modal de login após cadastro
                        abrirModalLogin();
                    } else {
                        alert(`Erro: ${dados.erro}`);
                    }
                } catch (erro) {
                    console.error('Erro:', erro);
                    alert('Ocorreu um erro ao cadastrar. Tente novamente.');
                }
            } else {
                alert(mensagemErro);
            }
        });
    }

    function validarEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Animação 
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
            card.style.transition = 'all 0.3s ease';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = '';
            card.style.transition = 'all 0.3s ease';
        });
    });

    // Animação para os cards de desenvolvedor
    const devCards = document.querySelectorAll('.desenvolvedor');
    devCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'scale(1.05)';
            card.style.transition = 'all 0.3s ease';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'scale(1)';
            card.style.transition = 'all 0.3s ease';
        });
    });

    const loginLink = document.querySelector('.login-link a');
    if (loginLink) {
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            abrirModalLogin();
        });
    }

    // Gerenciamento de tokens JWT
    function getToken() {
        return localStorage.getItem('token');
    }

    function getRefreshToken() {
        return localStorage.getItem('refreshToken');
    }

    function setAuthTokens(token, refreshToken) {
        localStorage.setItem('token', token);
        if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
        }
    }

    function removeAuthTokens() {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('usuario');
    }

    async function verificarToken() {
        const token = getToken();
        
        if (!token) {
            return false;
        }
        
        try {
            const resposta = await fetch('http://localhost:3000/verificar-token', {
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
        const refreshToken = getRefreshToken();
        
        if (!refreshToken) {
            removeAuthTokens();
            return false;
        }
        
        try {
            const resposta = await fetch('http://localhost:3000/refresh-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refreshToken })
            });
            
            if (resposta.ok) {
                const dados = await resposta.json();
                setAuthTokens(dados.token);
                return true;
            } else {
                removeAuthTokens();
                return false;
            }
        } catch (erro) {
            console.error('Erro ao renovar token:', erro);
            removeAuthTokens();
            return false;
        }
    }

    async function fetchAutenticado(url, options = {}) {
        const tokenValido = await verificarToken();
        
        if (!tokenValido) {
            alert('Sua sessão expirou. Por favor, faça login novamente.');
            abrirModalLogin();
            throw new Error('Token inválido ou expirado');
        }
        
        // Configurar headers com token
        const token = getToken();
        const headers = options.headers || {};
        headers['Authorization'] = `Bearer ${token}`;
        
        // Fazer requisição com headers atualizados
        return fetch(url, {
            ...options,
            headers
        });
    }

    function abrirModalLogin() {
        let modal = document.getElementById('modal-login');
        
        // Se não existir, criar o modal
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
                    const resposta = await fetch('http://localhost:3000/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ email, senha })
                    });

                    const dados = await resposta.json();

                    if (resposta.ok) {
                        setAuthTokens(dados.token, dados.refreshToken);
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

    async function atualizarInterfaceUsuarioLogado() {
        // Verificar token antes de atualizar a interface
        const tokenValido = await verificarToken();
        const usuarioString = localStorage.getItem('usuario');
        const btnEntrar = document.getElementById('entrar');
        const divOpcoesNav = document.querySelector('.opcoes_nav'); 

        if (tokenValido && usuarioString && btnEntrar && divOpcoesNav) {
            const usuario = JSON.parse(usuarioString);
            
            btnEntrar.textContent = 'Sair';
            btnEntrar.removeEventListener('click', abrirModalLogin); 
            btnEntrar.addEventListener('click', logout);

            let nomeUsuarioEl = document.getElementById('nome-usuario-nav');
            if (!nomeUsuarioEl) {
                nomeUsuarioEl = document.createElement('span');
                nomeUsuarioEl.id = 'nome-usuario-nav';
                nomeUsuarioEl.style.color = '#fff'; 
                nomeUsuarioEl.style.marginRight = '15px';
                divOpcoesNav.insertBefore(nomeUsuarioEl, btnEntrar); 
            }
            nomeUsuarioEl.textContent = `Olá, ${usuario.nome}!`;

        } else if (btnEntrar) {
            btnEntrar.textContent = 'Entrar';
            btnEntrar.removeEventListener('click', logout);
            
            // Remove qualquer listener de clique existente para evitar duplicação
            const btnEntrarClone = btnEntrar.cloneNode(true);
            btnEntrar.parentNode.replaceChild(btnEntrarClone, btnEntrar);

            btnEntrarClone.addEventListener('click', (e) => {
                e.preventDefault();
                abrirModalLogin();
            });

            let nomeUsuarioEl = document.getElementById('nome-usuario-nav');
            if (nomeUsuarioEl) {
                nomeUsuarioEl.remove();
            }
        }
    }

    async function logout() {
        const refreshToken = getRefreshToken();
        
        try {
            if (refreshToken) {
                await fetch('http://localhost:3000/logout', {
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
            // Remover tokens do cliente independentemente da resposta do servidor
            removeAuthTokens();
            alert('Você foi desconectado.');
            atualizarInterfaceUsuarioLogado();
        }
    }

   
    const btnEntrarInicial = document.getElementById('entrar');
    if (btnEntrarInicial && !getToken()) {
        const btnEntrarCloneInicial = btnEntrarInicial.cloneNode(true);
        btnEntrarInicial.parentNode.replaceChild(btnEntrarCloneInicial, btnEntrarInicial);
        
        btnEntrarCloneInicial.addEventListener('click', (e) => {
            e.preventDefault();
            abrirModalLogin();
        });
    }

    // Verificar token e atualizar interface ao carregar a página
    atualizarInterfaceUsuarioLogado();

    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'login') {
        const novaUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, novaUrl);
        
        if (!getToken()) {
             abrirModalLogin();
        }
    }

    const btnDenunciarTela1 = document.querySelector('#tela1 button'); 
    const linkDenunciarTela4 = document.querySelector('a[href="../client/html/denuncia.html"]'); 

    async function verificarLoginParaDenuncia(event) {
        const tokenValido = await verificarToken();
        if (!tokenValido) {
            event.preventDefault(); 
            alert('Você precisa estar logado para fazer uma denúncia.');
            abrirModalLogin();
        }
    }

    if (btnDenunciarTela1) {
        btnDenunciarTela1.removeEventListener('click', () => {
            const funcionalidadesSection = document.getElementById('tela3');
            if (funcionalidadesSection) {
                funcionalidadesSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
        btnDenunciarTela1.addEventListener('click', async (e) => {
            const tokenValido = await verificarToken();
            if (!tokenValido) {
                 e.preventDefault();
                 alert('Você precisa estar logado para fazer uma denúncia.');
                 abrirModalLogin();
            } else {
                 window.location.href = '../client/html/denuncia.html';
            }
        });
    }

    if (linkDenunciarTela4) {
        linkDenunciarTela4.addEventListener('click', verificarLoginParaDenuncia);
    }
    
    const textoTitulo = document.querySelector('#tela1 h1');
    if (textoTitulo) {
        const textoOriginal = textoTitulo.textContent;
        textoTitulo.textContent = '';
        
        const digitarTexto = (texto, elemento, i = 0) => {
            if (i < texto.length) {
                elemento.textContent += texto.charAt(i);
                setTimeout(() => digitarTexto(texto, elemento, i + 1), 50);
            }
        };
        
        setTimeout(() => {
            digitarTexto(textoOriginal, textoTitulo);
        }, 500);
    }

}); 