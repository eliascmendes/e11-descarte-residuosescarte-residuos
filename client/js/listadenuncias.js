document.addEventListener('DOMContentLoaded', async () => {
    // Importar a configuração da API
    let API_BASE_URL;
    
    try {
        const module = await import('./config/api.js');
        API_BASE_URL = module.default;
    } catch (error) {
        console.error('Erro ao carregar configuração da API:', error);
        API_BASE_URL = 'https://ecovigia-api.onrender.com'; 
    }
    
    // Se estamos na página de voto, não verificamos a autenticação
    const emPaginaVoto = window.location.pathname.includes('/voto.html');
    let todasDenuncias = [];

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

    // Verificar autenticação apenas se não estiver na página de voto pública
    if (!emPaginaVoto) {
        const autenticado = await verificarToken();
        if (!autenticado) {
            alert('Você precisa estar logado para acessar esta página.');
            window.location.href = '../index.html';
            return;
        }
    }

    const denunciasContainer = document.getElementById('denuncias-container');
    
    async function carregarDenuncias() {
        try {
            const resposta = await fetch(`${API_BASE_URL}/denuncias`);
            
            if (!resposta.ok) {
                throw new Error('Erro ao carregar denúncias');
            }
            
            const denuncias = await resposta.json();
            
            if (denuncias.length === 0) {
                denunciasContainer.innerHTML = '<div class="sem-denuncias">Nenhuma denúncia encontrada.</div>';
                return;
            }
            
            console.log('Denúncias carregadas:', denuncias);
            
            for (const denuncia of denuncias) {
                // Buscar contagem de votos para cada denúncia
                const respostaVotos = await fetch(`${API_BASE_URL}/votos/denuncias/${denuncia.id}`);
                if (respostaVotos.ok) {
                    const dadosVotos = await respostaVotos.json();
                    denuncia.votos = dadosVotos.total;
                } else {
                    denuncia.votos = 0;
                }
                
                // Buscar comentários para cada denúncia
                const respostaComentarios = await fetch(`${API_BASE_URL}/comentarios/denuncias/${denuncia.id}`);
                if (respostaComentarios.ok) {
                    const dadosComentarios = await respostaComentarios.json();
                    denuncia.comentarios = dadosComentarios;
                } else {
                    denuncia.comentarios = [];
                }
            }
            
            todasDenuncias = denuncias;
            
            denunciasContainer.innerHTML = '';
            
            denuncias.forEach(denuncia => {
                const card = criarCardDenuncia(denuncia);
                denunciasContainer.appendChild(card);
            });
        } catch (erro) {
            console.error('Erro:', erro);
            denunciasContainer.innerHTML = '<div class="sem-denuncias">Erro ao carregar denúncias. Tente novamente mais tarde.</div>';
        }
    }
    
    function criarCardDenuncia(denuncia) {
        const card = document.createElement('div');
        card.className = 'denuncia';
        
        // URL completa para a foto
        const fotoUrl = denuncia.foto_url 
            ? `${API_BASE_URL}${denuncia.foto_url}`
            : '../images/denuncia_exemplo.jpg';
        
        // Formatar descrição para mostrar
        const descricao = denuncia.descricao || 'Sem descrição disponível';
        
        // Formatação para mostrar apenas dois comentários
        const comentariosHTML = denuncia.comentarios && denuncia.comentarios.length > 0 
            ? denuncia.comentarios.slice(0, 2).map(comentario => `
                <div class="comentario">
                    <div class="comentario_usuario">${comentario.usuario || 'Usuário'}</div>
                    <div class="comentario_texto">${comentario.texto || 'Sem texto'}</div>
                    <div class="comentario_data">${formatarData(comentario.data_comentario)}</div>
                </div>
            `).join('')
            : '';

        // Ícone para o botão de voto
        const iconeVoto = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4L4 15H20L12 4Z" fill="currentColor"/>
            </svg>
        `;
        
        const dataCriacao = denuncia.data_criacao || denuncia.criado_em;
            
        card.innerHTML = `
            <div class="imagem">
                <img src="${fotoUrl}" alt="Foto da denúncia">
            </div>
            <div class="denuncia_descricao">
                <div class="cabecalho_problema">
                    <h2>${descricao}</h2>
                </div>
                <div class="endereco_denuncia">
                    <p>Rua: ${denuncia.rua || 'Não informada'}</p>
                    <p>Bairro: ${denuncia.bairro || ''} , Cidade: ${denuncia.cidade || 'Não informada'}</p>
                    <p>CEP: ${denuncia.cep || 'Não informado'}</p>
                </div>
                <div class="data-denuncia">
                    Publicado em: ${formatarData(dataCriacao)}
                </div>
                <div class="acoes_denuncia">
                    <button class="botao_votar" data-id="${denuncia.id}">
                        ${iconeVoto}
                        <span class="contagem">${denuncia.votos || 0}</span> votos
                    </button>
                    <button class="botao_comentar" data-id="${denuncia.id}">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>${denuncia.comentarios ? denuncia.comentarios.length : 0}</span>
                    </button>
                </div>
                ${comentariosHTML ? `<div class="comentarios">${comentariosHTML}</div>` : ''}
                <div class="form-comentario" style="display: none;">
                    <textarea placeholder="Escreva seu comentário aqui..." class="campo-comentario"></textarea>
                    <button class="enviar-comentario">Enviar</button>
                </div>
            </div>
        `;
        
        const botaoVoto = card.querySelector('.botao_votar');
        botaoVoto.addEventListener('click', () => votar(denuncia.id, botaoVoto));
        
        const botaoComentario = card.querySelector('.botao_comentar');
        const formComentario = card.querySelector('.form-comentario');
        
        botaoComentario.addEventListener('click', () => {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Você precisa estar logado para comentar.');
                return;
            }
            
            if (formComentario.style.display === 'none') {
                formComentario.style.display = 'block';
            } else {
                formComentario.style.display = 'none';
            }
        });
        
        const botaoEnviarComentario = card.querySelector('.enviar-comentario');
        botaoEnviarComentario.addEventListener('click', async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Você precisa estar logado para comentar.');
                return;
            }
            
            const campoComentario = card.querySelector('.campo-comentario');
            const textoComentario = campoComentario.value.trim();
            
            if (!textoComentario) {
                alert('Por favor, escreva um comentário antes de enviar.');
                return;
            }
            
            try {
                const resposta = await fetch(`${API_BASE_URL}/comentarios`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        denuncia_id: denuncia.id,
                        texto: textoComentario
                    })
                });
                
                if (resposta.ok) {
                    alert('Comentário enviado com sucesso!');
                    campoComentario.value = '';
                    formComentario.style.display = 'none';
                    
                    // Recarregar a lista de denúncias para mostrar o novo comentário
                    carregarDenuncias();
                } else {
                    const erro = await resposta.json();
                    alert(`Erro ao enviar comentário: ${erro.erro || 'Erro desconhecido'}`);
                }
            } catch (erro) {
                console.error('Erro ao enviar comentário:', erro);
                alert('Ocorreu um erro ao enviar o comentário. Tente novamente.');
            }
        });
        
        return card;
    }
    
    function formatarData(dataString) {
        if (!dataString) return 'Data não informada';
        
        try {
            const data = new Date(dataString);
            
            // Verificar se a data é válida
            if (isNaN(data.getTime())) {
                return 'Data não disponível';
            }
            
            // Formatar data e hora
            return data.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (erro) {
            console.error('Erro ao formatar data:', erro, dataString);
            return 'Data não disponível';
        }
    }
    
    async function votar(denunciaId, botao) {
        const token = localStorage.getItem('token');
        
        if (!token) {
            alert('Você precisa estar logado para votar.');
            return;
        }
        
        if (botao.disabled) {
            alert('Você já votou nesta denúncia.');
            return;
        }
        
        try {   
            const resposta = await fetch(`${API_BASE_URL}/votos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ denuncia_id: denunciaId })
            });
             
            const dados = await resposta.json();
            
            if (resposta.ok) {
                botao.disabled = true;
                botao.classList.add('votado');
                
                // Buscar a nova contagem de votos
                const respostaVotos = await fetch(`${API_BASE_URL}/votos/denuncias/${denunciaId}`);
                if (respostaVotos.ok) {
                    const dadosVotos = await respostaVotos.json();
                    const contador = botao.querySelector('.contagem');
                    contador.textContent = dadosVotos.total;
                    
                    // Atualizar também nos dados armazenados
                    const denuncia = todasDenuncias.find(d => d.id === denunciaId);
                    if (denuncia) {
                        denuncia.votos = dadosVotos.total;
                    }
                }
                
                alert('Voto registrado com sucesso!');
            } else {
                alert(`Erro: ${dados.error || dados.erro || 'Erro desconhecido'}`);
            }
        } catch (erro) {
            console.error('Erro detalhado:', erro);
            alert('Ocorreu um erro ao registrar o voto. Tente novamente.');
        }
    }
    
    carregarDenuncias();
}); 