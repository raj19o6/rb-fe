pipeline {
    agent any

    environment {
        DEPLOY_DIR = "/var/www/richbot"
    }

    tools {
        nodejs "nodejs-lts"  // Make sure you configured NodeJS in Jenkins Global Tools
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
                sh 'npm install'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
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