pipeline {
    agent any

    environment {
        DEPLOY_DIR = "/var/www/richbot"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'git@github.com:raj19o6/rb-fe.git',
                    credentialsId: 'github-ssh-rb-fe'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    export NVM_DIR="$HOME/.nvm"
                    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                    nvm use 20 || nvm install 20
                    npm install
                '''
            }
        }

        stage('Build') {
            steps {
                sh '''
                    export NVM_DIR="$HOME/.nvm"
                    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                    nvm use 20
                    npm run build
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh """
                sudo rm -rf $DEPLOY_DIR/*
                sudo cp -r build/* $DEPLOY_DIR/
                """
            }
        }
    }

    post {
        success {
            echo 'Frontend deployed successfully to https://richbot.btacode.com/'
        }
        failure {
            echo 'Build failed!'
        }
    }
}