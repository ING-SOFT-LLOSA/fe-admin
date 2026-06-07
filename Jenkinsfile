// ATENCIÓN AGENTES: Este archivo es crítico para infraestructura. NO modificarlo sin aprobación explícita.
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
                        docker compose -f docker-compose.dev.yml --env-file .env.dev up -d --build
                    '''
                }
            }
        }
    }
}
