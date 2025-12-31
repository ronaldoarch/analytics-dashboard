# 📊 Dashboard Analytics - Portfolio Project

Um dashboard interativo de analytics desenvolvido com **Spring Boot** e **JavaScript**, perfeito para demonstrar habilidades em desenvolvimento full-stack.

## ✨ Características

- 🎨 **Interface moderna** com design preto e dourado elegante
- 📈 **Visualizações interativas** usando Chart.js (gráficos de pizza, barras e linhas)
- 🔐 **Autenticação JWT** com Spring Security
- 📊 **Exportação de dados** em PDF e Excel
- 🔍 **Filtros avançados** por categoria, data e valor
- ⚡ **Atualização em tempo real** dos dados do dashboard
- 🔄 **CRUD completo** de métricas via REST API
- 💾 **Persistência de dados** com H2 Database (desenvolvimento) e PostgreSQL (produção)
- 🎯 **Dados de exemplo** pré-carregados para demonstração imediata
- 🧪 **Testes automatizados** incluídos

## 🚀 Tecnologias Utilizadas

### Backend
- **Spring Boot 2.7.18**
- **Spring Security** (Autenticação JWT)
- **Spring Data JPA**
- **Spring Web**
- **H2 Database** (desenvolvimento)
- **PostgreSQL** (produção)
- **Apache POI** (Exportação Excel)
- **iText** (Exportação PDF)
- **Lombok** (redução de boilerplate)

### Frontend
- **HTML5 / CSS3** (design preto e dourado)
- **JavaScript (ES6+)**
- **Chart.js** (visualizações de dados)
- **Design responsivo** (mobile-first)

## 📋 Pré-requisitos

- **Java JDK 17 ou superior** (não apenas JRE)
- **Maven** (ou use o Maven Wrapper incluído - `./mvnw`)
- Navegador moderno (Chrome, Firefox, Edge)

### ⚠️ Instalação do JDK

Se você receber o erro "No compiler is provided", significa que precisa instalar um JDK (não apenas JRE).

**No macOS com Homebrew:**
```bash
# Instalar OpenJDK 17
brew install openjdk@17

# Configurar JAVA_HOME (adicione ao seu ~/.zshrc ou ~/.bash_profile)
export JAVA_HOME=$(brew --prefix openjdk@17)/libexec/openjdk.jdk/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH
```

**Ou use o script de execução automático:**
```bash
./run.sh
```

## 🛠️ Como Executar

### Opção 1: Usando o script de execução (Recomendado)
```bash
./run.sh
```

### Opção 2: Usando Maven Wrapper manualmente
```bash
# Compilar o projeto
./mvnw clean install -DskipTests

# Executar o projeto
./mvnw spring-boot:run
```

### Opção 3: Se você tem Maven instalado
```bash
mvn clean install -DskipTests
mvn spring-boot:run
```

3. **Acesse o dashboard:**
   - Abra seu navegador em: `http://localhost:8080`
   - Console H2 Database: `http://localhost:8080/h2-console`
     - JDBC URL: `jdbc:h2:mem:analyticsdb`
     - Username: `sa`
     - Password: (deixe em branco)

## 🔐 Autenticação

O projeto inclui autenticação JWT. Usuários pré-configurados:

- **Admin:**
  - Username: `admin`
  - Password: `admin123`
  - Roles: ADMIN, USER

- **Usuário:**
  - Username: `user`
  - Password: `user123`
  - Roles: USER

**Nota:** O dashboard básico funciona sem login. A autenticação é necessária apenas para:
- Exportar dados (PDF/Excel)
- Operações administrativas (futuro)

## 📱 Funcionalidades

### Dashboard Principal
- **Cards de estatísticas**: Total de métricas, média geral, categoria top, valor total
- **Gráfico de distribuição**: Visualização em pizza das métricas por categoria
- **Série temporal**: Gráfico de linha mostrando evolução das métricas nas últimas 24h
- **Top 5 métricas**: Gráfico de barras com as métricas de maior valor
- **Totais por categoria**: Comparação visual dos valores por categoria

### Gerenciamento de Métricas
- **Tabela interativa**: Lista métricas com filtros avançados
- **Filtros**: Por categoria, valor mínimo/máximo, período de datas
- **Adicionar métricas**: Formulário completo com validação
- **Deletar métricas**: Remoção com confirmação

### Exportação
- **Exportar para Excel**: Gera arquivo .xlsx com todas as métricas
- **Exportar para PDF**: Gera relatório em PDF formatado

## 🔧 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/register` - Registro de novo usuário

### Métricas
- `GET /api/metrics` - Lista todas as métricas
- `GET /api/metrics/{id}` - Busca métrica por ID
- `GET /api/metrics/category/{category}` - Lista métricas por categoria
- `GET /api/metrics/filter` - Filtros avançados (query params: category, minValue, maxValue, startDate, endDate)
- `POST /api/metrics` - Cria nova métrica
- `DELETE /api/metrics/{id}` - Deleta métrica
- `GET /api/metrics/dashboard` - Retorna dados agregados para o dashboard

### Exportação (requer autenticação)
- `GET /api/export/excel` - Exporta métricas para Excel
- `GET /api/export/pdf` - Exporta métricas para PDF

## 🐳 Docker

### Build da imagem
```bash
./mvnw clean package
docker build -t analytics-dashboard .
```

### Executar com Docker Compose
```bash
docker-compose up -d
```

Isso iniciará:
- Aplicação Spring Boot na porta 8080
- PostgreSQL na porta 5432

## 🧪 Testes

Execute os testes com:
```bash
./mvnw test
```

## 📊 Estrutura do Projeto

```
algo-em-java/
├── src/
│   ├── main/
│   │   ├── java/com/portfolio/
│   │   │   ├── AnalyticsDashboardApplication.java
│   │   │   ├── config/
│   │   │   │   ├── DataInitializer.java
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   └── WebConfig.java
│   │   │   ├── controller/
│   │   │   │   ├── AuthController.java
│   │   │   │   ├── MetricController.java
│   │   │   │   └── ExportController.java
│   │   │   ├── dto/
│   │   │   │   ├── LoginRequest.java
│   │   │   │   └── LoginResponse.java
│   │   │   ├── model/
│   │   │   │   ├── Metric.java
│   │   │   │   ├── User.java
│   │   │   │   ├── DashboardData.java
│   │   │   │   ├── MetricSummary.java
│   │   │   │   └── TimeSeriesData.java
│   │   │   ├── repository/
│   │   │   │   ├── MetricRepository.java
│   │   │   │   └── UserRepository.java
│   │   │   ├── security/
│   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   └── JwtTokenProvider.java
│   │   │   └── service/
│   │   │       ├── AuthService.java
│   │   │       ├── CustomUserDetailsService.java
│   │   │       ├── ExportService.java
│   │   │       └── MetricService.java
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-prod.yml
│   │       └── static/
│   │           ├── index.html
│   │           ├── styles.css
│   │           └── app.js
│   └── test/
│       └── java/com/portfolio/
│           ├── MetricControllerTest.java
│           └── MetricServiceTest.java
├── pom.xml
├── Dockerfile
├── docker-compose.yml
├── mvnw (Maven Wrapper)
├── run.sh (Script de execução)
└── README.md
```

## 🎨 Personalização

### Cores e Estilo
As cores podem ser personalizadas no arquivo `styles.css` através das variáveis CSS:
```css
:root {
    --gold-color: #D4AF37;
    --secondary-color: #FFD700;
    /* ... */
}
```

## 🐛 Solução de Problemas

### Erro: "No compiler is provided"
**Solução**: Instale um JDK (não apenas JRE):
```bash
brew install openjdk@17
export JAVA_HOME=$(brew --prefix openjdk@17)/libexec/openjdk.jdk/Contents/Home
```

### Erro: "command not found: mvn"
**Solução**: Use o Maven Wrapper incluído (`./mvnw`) ou instale o Maven:
```bash
brew install maven
```

### Cache do navegador
**Solução**: Faça hard refresh:
- Mac: `Cmd + Shift + R`
- Windows/Linux: `Ctrl + Shift + R`

## 🚀 Deploy

### ⚠️ Importante sobre Vercel
**Vercel não suporta aplicações Spring Boot** (requer servidor Java). Use uma das opções abaixo:

### Railway (Recomendado - Mais Fácil) 🚂
1. Acesse [railway.app](https://railway.app) e faça login com GitHub
2. Clique em "New Project" → "Deploy from GitHub repo"
3. Selecione o repositório `analytics-dashboard`
4. Railway detectará automaticamente o projeto Java
5. Adicione PostgreSQL como serviço
6. Configure variáveis de ambiente:
   - `SPRING_PROFILES_ACTIVE=prod`
   - `SPRING_DATASOURCE_URL` (será preenchido automaticamente pelo PostgreSQL)
7. Deploy automático! 🎉

### Render (Gratuito) 🎨
1. Acesse [render.com](https://render.com) e faça login com GitHub
2. Clique em "New" → "Web Service"
3. Conecte o repositório `analytics-dashboard`
4. Configurações:
   - **Build Command:** `./mvnw clean package -DskipTests`
   - **Start Command:** `java -jar target/*.jar`
   - **Environment:** `Java`
5. Adicione PostgreSQL Database
6. Configure variáveis de ambiente (Render preenche automaticamente)
7. Deploy! 🚀

### Fly.io (Gratuito) ✈️
```bash
# Instalar flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Deploy
fly launch
fly deploy
```

### Docker (Local ou VPS)
```bash
# Build
docker build -t analytics-dashboard .

# Run com PostgreSQL
docker-compose up -d
```

### Variáveis de Ambiente para Produção
```bash
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=jdbc:postgresql://host:5432/analyticsdb
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=sua-senha
JWT_SECRET=sua-chave-secreta-aqui-com-pelo-menos-32-caracteres
PORT=8080
```

## 📝 Licença

Este projeto foi desenvolvido para fins de portfólio e demonstração.

## 👨‍💻 Autor

Desenvolvido como projeto de portfólio demonstrando habilidades em:
- Backend Java/Spring Boot
- Frontend JavaScript/HTML/CSS
- Autenticação e Autorização (JWT)
- Exportação de dados
- Visualização de dados
- Design moderno e UX
- Testes automatizados
- Docker e Deploy

---

**Dica para o Portfólio**: Este projeto demonstra conhecimento em:
- ✅ Arquitetura RESTful
- ✅ Autenticação JWT
- ✅ Persistência de dados com JPA
- ✅ Frontend interativo e responsivo
- ✅ Exportação de dados (PDF/Excel)
- ✅ Filtros e busca avançada
- ✅ Visualização de dados
- ✅ Testes automatizados
- ✅ Docker e containerização
- ✅ Boas práticas de desenvolvimento
- ✅ Design moderno e UX
