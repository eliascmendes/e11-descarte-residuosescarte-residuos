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

    // Botão entrar
    const btnEntrar = document.getElementById('entrar');
    if (btnEntrar) {
        btnEntrar.addEventListener('click', () => {
            const cadastroSection = document.getElementById('tela2');
            if (cadastroSection) {
                cadastroSection.scrollIntoView({ behavior: 'smooth' });
                setTimeout(() => {
                    document.getElementById('nome').focus();
                }, 800);
            }
        });
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

    //  formato de email
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
                
                let isValid = true;
                let mensagemErro = '';
                
                if (email === '' || !validarEmail(email)) {
                    isValid = false;
                    mensagemErro = 'Por favor, insira um email válido.';
                }
                else if (senha === '') {
                    isValid = false;
                    mensagemErro = 'Por favor, insira sua senha.';
                }
                
                if (isValid) {
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
                            // Armazenar token no localStorage
                            localStorage.setItem('token', dados.token);
                            localStorage.setItem('usuario', JSON.stringify(dados.usuario));
                            
                            alert('Login realizado com sucesso!');
                            modal.style.display = 'none';
                            e.target.reset();
                            
                            // Verificar se o usuário está na página inicial e atualizar a interface
                            atualizarInterfaceUsuarioLogado();
                        } else {
                            alert(`Erro: ${dados.erro}`);
                        }
                    } catch (erro) {
                        console.error('Erro:', erro);
                        alert('Ocorreu um erro ao fazer login. Tente novamente.');
                    }
                } else {
                    alert(mensagemErro);
                }
            });
        }
        
        modal.style.display = 'flex';
        setTimeout(() => {
            document.getElementById('login-email').focus();
        }, 100);
    }

    // Função para atualizar a interface quando o usuário está logado
    function atualizarInterfaceUsuarioLogado() {
        const token = localStorage.getItem('token');
        const usuarioString = localStorage.getItem('usuario');
        
        if (token && usuarioString) {
            try {
                const usuario = JSON.parse(usuarioString);
                
                // Mudar o botão "Entrar" para o nome do usuário ou "Minha Conta"
                const btnEntrar = document.getElementById('entrar');
                if (btnEntrar) {
                    btnEntrar.textContent = usuario.nome || 'Minha Conta';
                    
                    // Remover o evento atual
                    const novoBtn = btnEntrar.cloneNode(true);
                    btnEntrar.parentNode.replaceChild(novoBtn, btnEntrar);
                    
                    // Adicionar dropdown para opções de conta
                    novoBtn.addEventListener('click', () => {
                        const dropdownId = 'dropdown-conta';
                        let dropdown = document.getElementById(dropdownId);
                        
                        if (!dropdown) {
                            dropdown = document.createElement('div');
                            dropdown.id = dropdownId;
                            dropdown.className = 'dropdown-conta';
                            dropdown.innerHTML = `
                                <div class="dropdown-item">Meu Perfil</div>
                                <div class="dropdown-item">Minhas Denúncias</div>
                                <div class="dropdown-item sair">Sair</div>
                            `;
                            
                            const style = document.createElement('style');
                            style.textContent += `
                                .dropdown-conta {
                                    position: absolute;
                                    right: 10px;
                                    top: 60px;
                                    background: white;
                                    border-radius: 8px;
                                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                                    padding: 10px 0;
                                    z-index: 1000;
                                    display: none;
                                    width: 180px;
                                }
                                .dropdown-item {
                                    padding: 8px 15px;
                                    cursor: pointer;
                                }
                                .dropdown-item:hover {
                                    background-color: #f9fafb;
                                }
                                .dropdown-item.sair {
                                    color: #dc2626;
                                }
                            `;
                            document.head.appendChild(style);
                            document.querySelector('nav').appendChild(dropdown);
                            
                            // Adicionar eventos aos itens do dropdown
                            document.querySelector('.dropdown-item.sair').addEventListener('click', () => {
                                localStorage.removeItem('token');
                                localStorage.removeItem('usuario');
                                window.location.reload();
                            });
                        }
                        
                        // Mostrar ou esconder o dropdown
                        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
                    });
                    
                    // Fechar dropdown quando clicar fora
                    document.addEventListener('click', (e) => {
                        const dropdown = document.getElementById('dropdown-conta');
                        if (dropdown && !e.target.closest('#entrar') && !e.target.closest('#dropdown-conta')) {
                            dropdown.style.display = 'none';
                        }
                    });
                }
                
                // Atualizar links para "Denunciar"
                const btnDenunciar = document.querySelector('#tela1 button');
                if (btnDenunciar) {
                    btnDenunciar.addEventListener('click', (e) => {
                        e.preventDefault();
                        window.location.href = 'html/denuncia.html';
                    });
                }
            } catch (erro) {
                console.error('Erro ao processar informações do usuário:', erro);
            }
        }
    }

    // Verificar se o usuário já está logado ao carregar a página
    atualizarInterfaceUsuarioLogado();

    // Efeito de digitação para o texto principal
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