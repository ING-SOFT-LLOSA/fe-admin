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
                    string(credentialsId: 'NEXT_PUBLIC_FIREBASE_API_KEY_LLOSA', variable: 'NEXT_PUBLIC_FIREBASE_API_KEY_LLOSA'),
                    string(credentialsId: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_LLOSA', variable: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_LLOSA'),
                    string(credentialsId: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID_LLOSA', variable: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID_LLOSA'),
                    string(credentialsId: 'NEXT_PUBLIC_API_URL_LLOSA', variable: 'NEXT_PUBLIC_API_URL_LLOSA')
                ]) {
                    sh '''
                        export NEXT_PUBLIC_API_URL_LLOSA="https://backend-llosa-dev.ingsoftware.lat"
                        docker compose -p llosa_front_dev -f docker-compose.yml down --remove-orphans || true
                        docker rm -f front-llosa-dev 2>/dev/null || true
                        docker compose -p llosa_front_dev -f docker-compose.yml up -d --build front-llosa-dev
                    '''
                }
            }
        }
    }
}
