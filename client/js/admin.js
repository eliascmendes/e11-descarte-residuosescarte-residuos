document.addEventListener('DOMContentLoaded', async () => {
    let API_BASE_URL;
    try {
        const module = await import('./config/api.js');
        API_BASE_URL = module.default;
    } catch (error) {
        console.error('Erro ao carregar configuração da API:', error);
        API_BASE_URL = 'https://ecovigia-api.onrender.com';
    }

    const denunciasContainer = document.getElementById('denuncias-container');
    const statusFilter = document.getElementById('status-filter');
    const searchInput = document.getElementById('search');
    const modal = document.getElementById('confirm-modal');
    const modalCancel = document.getElementById('modal-cancel');
    const modalConfirm = document.getElementById('modal-confirm');

    let denuncias = [];
    let denunciaParaExcluir = null;

    // Verificar se o usuário é administrador
    async function verificarAdmin() {
        const token = localStorage.getItem('token');
        if (!token) {
            mostrarErro('Você precisa estar logado para acessar esta página.');
            return false;
        }

        try {
            const usuario = JSON.parse(localStorage.getItem('usuario'));
            if (!usuario || usuario.tipo !== 'administrador') {
                mostrarErro('Acesso negado. Esta página é exclusiva para administradores.');
                return false;
            }
            return true;
        } catch (error) {
            console.error('Erro ao verificar permissões:', error);
            mostrarErro('Erro ao verificar permissões de acesso.');
            return false;
        }
    }

    // Buscar todas as denúncias
    async function buscarDenuncias() {
        const token = localStorage.getItem('token');
        if (!token) return [];

        try {
            const resposta = await fetch(`${API_BASE_URL}/denuncias`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!resposta.ok) {
                throw new Error('Falha ao buscar denúncias');
            }

            return await resposta.json();
        } catch (error) {
            console.error('Erro ao buscar denúncias:', error);
            mostrarErro('Erro ao buscar denúncias. Por favor, tente novamente.');
            return [];
        }
    }

    // Atualizar status de uma denúncia
    async function atualizarStatus(id, status) {
        const token = localStorage.getItem('token');
        if (!token) return false;

        try {
            const resposta = await fetch(`${API_BASE_URL}/denuncias/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            if (!resposta.ok) {
                throw new Error('Falha ao atualizar status');
            }

            return true;
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            return false;
        }
    }

    // Excluir uma denúncia
    async function excluirDenuncia(id) {
        const token = localStorage.getItem('token');
        if (!token) return false;

        try {
            const resposta = await fetch(`${API_BASE_URL}/denuncias/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!resposta.ok) {
                throw new Error('Falha ao excluir denúncia');
            }

            return true;
        } catch (error) {
            console.error('Erro ao excluir denúncia:', error);
            return false;
        }
    }

    function renderizarDenuncias(denunciasParaExibir) {
        denunciasContainer.innerHTML = '';

        if (denunciasParaExibir.length === 0) {
            denunciasContainer.innerHTML = '<div class="error-message">Nenhuma denúncia encontrada</div>';
            return;
        }

        const template = document.getElementById('denuncia-template');

        denunciasParaExibir.forEach(denuncia => {
            const clone = template.content.cloneNode(true);
            
            const card = clone.querySelector('.denuncia-card');
            card.dataset.id = denuncia.id;
            
            clone.querySelector('.denuncia-id').textContent = `#${denuncia.id}`;
            
            const statusElement = clone.querySelector('.denuncia-status');
            statusElement.textContent = denuncia.status;
            statusElement.className = `denuncia-status status-${denuncia.status.replace(' ', '-')}`;
            
            clone.querySelector('.denuncia-local').textContent = `${denuncia.cidade}, ${denuncia.rua}`;
            clone.querySelector('.denuncia-desc').textContent = denuncia.descricao;
            
            const data = new Date(denuncia.data_criacao).toLocaleDateString('pt-BR');
            clone.querySelector('.denuncia-data').textContent = `Data: ${data}`;
            
            clone.querySelector('.denuncia-autor').textContent = `Autor ID: ${denuncia.usuario_id}`;
            
            const imgElement = clone.querySelector('.denuncia-img');
            if (denuncia.foto_url) {
                imgElement.src = denuncia.foto_url;
                imgElement.alt = `Foto da denúncia #${denuncia.id}`;
            } else {
                imgElement.src = '../images/no-image.png';
                imgElement.alt = 'Sem imagem disponível';
            }
            
            const selectStatus = clone.querySelector('.status-update');
            selectStatus.value = denuncia.status;
            
            const btnSave = clone.querySelector('.btn-save');
            btnSave.addEventListener('click', async () => {
                const novoStatus = selectStatus.value;
                if (novoStatus !== denuncia.status) {
                    btnSave.disabled = true;
                    btnSave.textContent = 'Salvando...';
                    
                    const sucesso = await atualizarStatus(denuncia.id, novoStatus);
                    
                    if (sucesso) {
                        denuncia.status = novoStatus;
                        statusElement.textContent = novoStatus;
                        statusElement.className = `denuncia-status status-${novoStatus.replace(' ', '-')}`;
                        alert('Status atualizado com sucesso!');
                    } else {
                        alert('Erro ao atualizar status. Tente novamente.');
                        selectStatus.value = denuncia.status;
                    }
                    
                    btnSave.disabled = false;
                    btnSave.textContent = 'Salvar Status';
                }
            });
            
            const btnDelete = clone.querySelector('.btn-delete');
            btnDelete.addEventListener('click', () => {
                denunciaParaExcluir = denuncia.id;
                modal.classList.add('active');
            });
            
            denunciasContainer.appendChild(clone);
        });
    }

    // Filtrar denúncias
    function filtrarDenuncias() {
        const statusSelecionado = statusFilter.value;
        const termoBusca = searchInput.value.toLowerCase();
        
        let resultado = denuncias;
        
        // Filtrar por status
        if (statusSelecionado !== 'todos') {
            resultado = resultado.filter(d => d.status === statusSelecionado);
        }
        
        // Filtrar por termo de busca
        if (termoBusca) {
            resultado = resultado.filter(d => 
                d.descricao.toLowerCase().includes(termoBusca) ||
                d.cidade.toLowerCase().includes(termoBusca) ||
                d.rua.toLowerCase().includes(termoBusca) ||
                d.id.toString().includes(termoBusca)
            );
        }
        
        renderizarDenuncias(resultado);
    }

    // Mostrar mensagem de erro
    function mostrarErro(mensagem) {
        denunciasContainer.innerHTML = `<div class="error-message">${mensagem}</div>`;
    }

    // Inicializar página
    async function inicializar() {
        const ehAdmin = await verificarAdmin();
        if (!ehAdmin) return;
        
        denunciasContainer.innerHTML = '<div class="loading">Carregando denúncias...</div>';
        
        denuncias = await buscarDenuncias();
        renderizarDenuncias(denuncias);
        
        // Adicionar eventos
        statusFilter.addEventListener('change', filtrarDenuncias);
        searchInput.addEventListener('input', filtrarDenuncias);
        
        modalCancel.addEventListener('click', () => {
            modal.classList.remove('active');
            denunciaParaExcluir = null;
        });
        
        modalConfirm.addEventListener('click', async () => {
            if (denunciaParaExcluir) {
                modalConfirm.disabled = true;
                modalConfirm.textContent = 'Excluindo...';
                
                const sucesso = await excluirDenuncia(denunciaParaExcluir);
                
                if (sucesso) {
                    denuncias = denuncias.filter(d => d.id !== denunciaParaExcluir);
                    renderizarDenuncias(denuncias);
                    alert('Denúncia excluída com sucesso!');
                } else {
                    alert('Erro ao excluir denúncia. Tente novamente.');
                }
                
                modal.classList.remove('active');
                denunciaParaExcluir = null;
                modalConfirm.disabled = false;
                modalConfirm.textContent = 'Confirmar Exclusão';
            }
        });
    }

    // Iniciar
    inicializar();
}); 