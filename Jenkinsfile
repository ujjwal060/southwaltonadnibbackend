pipeline {
    agent any

    environment {
        IMAGE_NAME = "docker.io/kartikeytiwari/aouth-walton-admin-backend"
        IMAGE_TAG = "${BUILD_NUMBER}"
        CONTAINER_PORT = "8132"
        HOST_PORT = "8132"
        CONTAINER_NAME = "${JOB_BASE_NAME}-container"
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Login to Docker Hub') {
            steps {
                script {
                    withCredentials([usernamePassword(
                        credentialsId: 'docker-hub-credentials',
                        usernameVariable: 'DOCKER_USERNAME',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )]) {
                        sh '''
                            echo Logging in to Docker Hub...
                            echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin
                        '''
                    }
                }
            }
        }

        stage('Generate Next Image Tag') {
            steps {
                script {
                    echo "✅ Using Image Tag: $IMAGE_TAG"
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                    docker build -t $IMAGE_NAME:$IMAGE_TAG .
                '''
            }
        }

        stage('Tag Docker Image') {
            steps {
                sh '''
                    docker tag $IMAGE_NAME:$IMAGE_TAG $IMAGE_NAME:latest
                '''
            }
        }

        stage('Push Docker Image to Docker Hub') {
            steps {
                sh '''
                    docker push $IMAGE_NAME:$IMAGE_TAG
                    docker push $IMAGE_NAME:latest
                '''
            }
        }

        stage('Stop Existing Container') {
            steps {
                sh '''
                    docker stop $CONTAINER_NAME || true
                    docker rm $CONTAINER_NAME || true
                '''
            }
        }

        stage('Run New Docker Container') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-jenkins-creds']]) {
                    sh '''
                        export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
                        export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY

                        SECRET_JSON=$(aws secretsmanager get-secret-value \
                        --region ap-south-1 \
                        --secret-id south-voltana \
                        --query SecretString \
                        --output text)

                        echo "✅ Secrets fetched: $SECRET_JSON"
                    '''
                }

            }
        }
    }

    post {
        always {
            script {
                echo "📩 Sending deployment email..."
                emailext (
                    to: 'kartikey.tiwari@aayaninfotech.com',
                    subject: "Deployment Pipeline - ${currentBuild.fullDisplayName}",
                    body: "Job '${env.JOB_NAME} [#${env.BUILD_NUMBER}]' completed with status: ${currentBuild.currentResult}"
                )
            }
        }
    }
}
