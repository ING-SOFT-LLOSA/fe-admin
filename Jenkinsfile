pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '5'))
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install & Test') {
            agent {
                docker {
                    image 'node:20'
                    reuseNode true
                }
            }
            steps {
                sh '''
                    # Instalar dependencias del sistema primero
                    apt-get update && apt-get install -y \
                        libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
                        libcups2 libatspi2.0-0 libxrandr2 libxcomposite1 \
                        libxdamage1 libxkbcommon0 libpango-1.0-0 libpangocairo-1.0-0

                    npm ci
                    npx playwright install chromium --no-deps
                    npm run test -- --coverage
                    npx playwright test
                '''
            }
        }

        stage('SonarQube Analysis') {
            agent {
                docker {
                    image 'node:22-bookworm'
                    reuseNode true
                }
            }
            steps {
                withSonarQubeEnv('SonarQube-Server') {
                    sh '''
                        export COREPACK_HOME="$WORKSPACE/.corepack"
                        export SONAR_TOKEN="${SONAR_AUTH_TOKEN:-$SONAR_TOKEN}"
                        corepack pnpm --package=sonarqube-scanner@4 dlx sonar-scanner \
                            -Dsonar.host.url="$SONAR_HOST_URL"
                    '''
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 1, unit: 'HOURS') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Deploy (Docker Compose)') {
            steps {
                withCredentials([
                    string(credentialsId: 'NEXT_PUBLIC_FIREBASE_API_KEY_LLOSA', variable: 'NEXT_PUBLIC_FIREBASE_API_KEY_LLOSA'),
                    string(credentialsId: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_LLOSA', variable: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_LLOSA'),
                    string(credentialsId: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID_LLOSA', variable: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID_LLOSA'),
                    string(credentialsId: 'NEXT_PUBLIC_API_URL_LLOSA', variable: 'NEXT_PUBLIC_API_URL_LLOSA')
                ]) {
                    sh '''
                        docker rm -f front-llosa || true
                        docker compose -f docker-compose.yml down || true
                        docker compose -f docker-compose.yml up -d --build front-llosa
                    '''
                }
            }
        }
    }
}
