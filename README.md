# EcoVigia

EcoVigia é uma plataforma comunitária projetada para combater o descarte irregular de resíduos. Através dela, cidadãos podem denunciar locais de descarte inadequado em suas cidades, acompanhar o status dessas denúncias e colaborar ativamente para promover um ambiente urbano mais limpo e sustentável.

## Principais Funcionalidades

*   **Denúncias Georreferenciadas:** Reporte pontos de descarte irregular diretamente em um mapa interativo usando suas coordenadas geográficas.
*   **Acompanhamento Comunitário:** Visualize denúncias de outros usuários e acompanhe o progresso da resolução.
*   **Upload de Evidências:** Anexe fotos às suas denúncias para fornecer mais detalhes, com armazenamento via Cloudinary.
*   **Priorização por Votos:** A comunidade pode votar nas denúncias mais críticas, ajudando a priorizar ações.
*   **Engajamento e Discussão:** Comente nas denúncias para discutir soluções e compartilhar informações relevantes.
*   **Mapa Interativo:** Visualize todos os pontos de descarte irregular reportados em um mapa intuitivo com Leaflet.
*   **Sistema de Autenticação:** Cadastro e login de usuários com diferentes níveis de acesso (moradores e administradores). (Em construção)

## Tecnologias Utilizadas

### Backend
*   **Node.js e Express:** Framework para construção da API RESTful.
*   **PostgreSQL:** Banco de dados relacional para armazenamento persistente de dados.
*   **JWT (JSON Web Token):** Autenticação segura para usuários.
*   **Multer:** Middleware para gerenciamento de uploads de arquivos.
*   **Cloudinary:** Serviço para armazenamento de imagens.
*   **Bcrypt:** Criptografia de senhas para segurança dos usuários.
*   **Swagger:** Documentação interativa da API.

### Frontend
*   **HTML5, CSS3, JavaScript:** Tecnologias fundamentais para a interface do usuário.
*   **Leaflet:** Biblioteca JavaScript para mapas interativos.
*   **Design Responsivo:** Interface adaptada para dispositivos móveis e desktop.

### Hospedagem e Deploy
*   **Render:** Plataforma para hospedagem do frontend, backend e banco de dados.
*   **CI/CD:** Configuração para deploy automático via repositório Git.

```

## Modelos de Dados

O sistema utiliza os seguintes modelos principais:

* **Usuários:** Gerenciamento de contas com diferentes papéis (moradores e administradores). (Em construção)
* **Denúncias:** Registros de pontos de descarte irregular com informações geográficas e status.
* **Votos:** Sistema de priorização de denúncias pela comunidade.
* **Comentários:** Espaço para discussão e acompanhamento das denúncias.

## Equipe de Desenvolvimento

*   **Elias** - Backend Developer ([GitHub](https://github.com/eliascmendhes))
*   **Hellem Mendonça** - Frontend Developer ([GitHub](https://github.com/hellemmendoncaa))
*   **Matheus Abreu** - Backend Developer ([GitHub](https://github.com/Matheus4breu))
*   **Railton Rosa** - Backend Developer ([GitHub](https://github.com/Railton-Carvalho))
*   **Raylan Bruno** - Frontend Developer ([GitHub](https://github.com/Raylan-BR))

## Licença

Distribuído sob a Licença MIT. Veja `LICENSE` para mais informações.