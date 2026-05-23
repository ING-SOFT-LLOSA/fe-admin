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
                    npm run test -- --coverage
                '''
            }
        }

        stage('Build') {
            agent {
                docker {
                    image 'node:20-alpine'
                    reuseNode true
                }
            }
            steps {
                sh '''
                    npm run build
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
                    waitForQualityGate abortPipeline: false
                }
            }
        }

        stage('Deploy (Docker Compose)') {
            steps {
                withCredentials([
                    string(credentialsId: 'NEXT_PUBLIC_FIREBASE_API_KEY_ID', variable: 'NEXT_PUBLIC_FIREBASE_API_KEY'),
                    string(credentialsId: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_ID', variable: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
                    string(credentialsId: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID_ID', variable: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
                    string(credentialsId: 'NEXT_PUBLIC_API_URL_ID', variable: 'NEXT_PUBLIC_API_URL')
                ]) {
                    sh '''
                        docker compose down
                        docker compose up -d --build front-llosa-admin
                    '''
                }
            }
        }
    }
}
