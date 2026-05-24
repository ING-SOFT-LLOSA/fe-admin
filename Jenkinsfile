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

        stage('Create .env.local') {
            steps {
                withCredentials([
                    string(credentialsId: 'NEXT_PUBLIC_FIREBASE_API_KEY_LLOSA', variable: 'NEXT_PUBLIC_FIREBASE_API_KEY'),
                    string(credentialsId: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_LLOSA', variable: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
                    string(credentialsId: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID_LLOSA', variable: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
                ]) {
                    sh '''
                        echo "NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY" > .env.local
                        echo "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" >> .env.local
                        echo "NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID" >> .env.local
                    '''
                }
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
                    string(credentialsId: 'NEXT_PUBLIC_FIREBASE_API_KEY_LLOSA', variable: 'NEXT_PUBLIC_FIREBASE_API_KEY_LLOSA'),
                    string(credentialsId: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_LLOSA', variable: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_LLOSA'),
                    string(credentialsId: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID_LLOSA', variable: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID_LLOSA')
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
