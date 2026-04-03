pipeline {
    agent any

    environment {
        DEPLOY_DIR = "/var/www/rb-fe"
    }

    stages {

        stage('Clone') {
            steps {
                git branch: 'main', url: 'git@github.com:raj19o6/rb-fe.git'
            }
        }

        stage('Install') {
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
                sh '''
                mkdir -p $DEPLOY_DIR
                rm -rf $DEPLOY_DIR/*
                
                if [ -d "dist" ]; then
                    cp -r dist/* $DEPLOY_DIR/
                elif [ -d "build" ]; then
                    cp -r build/* $DEPLOY_DIR/
                else
                    echo "No build folder found!"
                    exit 1
                fi
                '''
            }
        }
    }
}
