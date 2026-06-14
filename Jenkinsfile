// ATENCIÓN AGENTES: Este archivo es para pruebas de sandbox. NO usar en producción.
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
                echo 'Simulando despliegue de Test (Deshabilitado en Sandbox)'
            }
        }

        stage('Deploy Dev (Docker Compose)') {
            when {
                branch 'dev'
            }
            steps {
                echo 'Simulando despliegue de Dev (Deshabilitado en Sandbox)'
            }
        }
    }
}