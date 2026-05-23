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

        stage('Install & Lint') {
            agent {
                docker {
                    image 'node:20-alpine'
                    reuseNode true
                }
            }
            steps {
                sh '''
                    npm ci
                    npm run test
                    npm run lint
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
            environment {
                scannerHome = tool 'SonarScanner'
            }
            steps {
                withSonarQubeEnv('SonarQube-Server') {
                    sh "${scannerHome}/bin/sonar-scanner"
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
                        docker compose up -d --build front-llosa
                    '''
                }
            }
        }
    }
}
