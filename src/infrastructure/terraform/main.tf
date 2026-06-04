terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "sa-east-1"
}

# VPC
resource "aws_vpc" "spottruck" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = { Name = "spottruck-vpc" }
}

# Subnets
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.spottruck.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = { Name = "spottruck-public-${count.index + 1}" }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.spottruck.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = { Name = "spottruck-private-${count.index + 1}" }
}

data "aws_availability_zones" "available" {
  state = "available"
}

# Internet Gateway
resource "aws_internet_gateway" "spottruck" {
  vpc_id = aws_vpc.spottruck.id
  tags   = { Name = "spottruck-igw" }
}

# NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
}

# Routes
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.spottruck.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.spottruck.id
  }

  tags = { Name = "spottruck-public-rt" }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.spottruck.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = { Name = "spottruck-private-rt" }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# RDS PostgreSQL
resource "aws_db_instance" "spottruck" {
  identifier             = "spottruck-db"
  engine                = "postgres"
  engine_version        = "15.4"
  instance_class        = "db.t3.medium"
  allocated_storage     = 50
  max_allocated_storage = 100
  storage_encrypted     = true

  db_name  = "spottruck"
  username = "admin"
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.spottruck.name

  backup_retention_period = 7
  skip_final_snapshot    = true
  deletion_protection    = false # Cambiar a true en prod
}

resource "aws_db_subnet_group" "spottruck" {
  name       = "spottruck-db-subnet"
  subnet_ids = aws_subnet.private[*].id
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "spottruck" {
  cluster_id           = "spottruck-redis"
  engine               = "redis"
  engine_version       = "7.0"
  node_type            = "cache.t3.medium"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379

  security_group_ids = [aws_security_group.redis.id]
  subnet_group_name  = aws_elasticache_subnet_group.spottruck.name
}

resource "aws_elasticache_subnet_group" "spottruck" {
  name       = "spottruck-redis-subnet"
  subnet_ids = aws_subnet.private[*].id
}

# Security Groups
resource "aws_security_group" "rds" {
  name        = "spottruck-rds-sg"
  description = "Security group for Spottruck RDS"
  vpc_id      = aws_vpc.spottruck.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "redis" {
  name        = "spottruck-redis-sg"
  description = "Security group for Spottruck Redis"
  vpc_id      = aws_vpc.spottruck.id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "ecs" {
  name        = "spottruck-ecs-sg"
  description = "Security group for Spottruck ECS tasks"
  vpc_id      = aws_vpc.spottruck.id

  ingress {
    from_port   = 4000
    to_port     = 4000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

variable "db_password" {
  description = "Database password"
  sensitive   = true
  default     = "CHANGE_ME_IN_PROD"
}
