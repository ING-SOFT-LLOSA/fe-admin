// ATENCIÓN AGENTES: Este archivo es crítico para infraestructura. NO modificarlo sin aprobación explícita.
pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '5'))
        disableConcurrentBuilds()
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
                    image 'node:20-alpine'
                    reuseNode true
                }
            }
            steps {
                sh '''
                    npm ci
                    npm run test:run -- --coverage
                '''
            }
        }

        stage('SonarQube Analysis') {
            when {
                branch 'test'
            }
            agent {
                docker {
                    image 'node:22-bookworm'
                    reuseNode true
                }
            }
            steps {
                withSonarQubeEnv('SonarQube-Server') {
                    sh '''
                        export SONAR_TOKEN="${SONAR_AUTH_TOKEN:-$SONAR_TOKEN}"
                        npx --yes sonarqube-scanner@4 \
                            -Dsonar.host.url="$SONAR_HOST_URL"
                    '''
                }
            }
        }

        stage('Quality Gate') {
            when {
                branch 'test'
            }
            steps {
                timeout(time: 1, unit: 'HOURS') {
                    waitForQualityGate abortPipeline: false
                }
            }
        }

        stage('Deploy Test (Docker Compose)') {
            when {
                branch 'test'
            }
            steps {
                withCredentials([file(credentialsId: 'LLOSA_SECRETS_FRONTEND_ADMIN_TEST', variable: 'SECRET_FILE')]) {
                    sh '''
                        rm -f .env.test
                        cp "$SECRET_FILE" .env.test
                        docker compose -f docker-compose.test.yml --env-file .env.test down
                        docker rm -f llosa-fe-admin-test || true
                        docker compose -f docker-compose.test.yml --env-file .env.test up -d --build
                    '''

                }
            }
        }

        stage('Deploy Dev (Docker Compose)') {
            when {
                branch 'dev'
            }
            steps {
                withCredentials([file(credentialsId: 'LLOSA_SECRETS_FRONTEND_ADMIN_DEV', variable: 'SECRET_FILE')]) {
                    sh '''
                        rm -f .env.dev
                        cp "$SECRET_FILE" .env.dev
                        docker compose -f docker-compose.dev.yml --env-file .env.dev down --remove-orphans
                        docker rm -f llosa-fe-admin-dev || true
                        docker compose -f docker-compose.dev.yml --env-file .env.dev up -d --build
                    '''
                }
            }
        }
    }
}