---
title: "Project Summary - Spottruck"
date: 2026-06-04
author: Jarvis AI
status: draft
tags: [spottruck, project, summary]
---

# Spottruck - Project Summary

## Overview
Spottruck es una plataforma digital que conecta empresas que necesitan transporte de carga con camioneros en Argentina. Resuelve el problema fundamental de camiones que viajan cargados a Buenos Aires pero no encuentran viaje de vuelta, perdiendo dinero, y empresas/agroquímicas en cosecha que no encuentran logística, perdiendo tiempo.

## Problem Statement

### Pain Points
- **Transportistas:** Camiones vacíos en el viaje de regreso = pérdida de revenue
- **Empresas:** Dificultad para conseguir transporte especialmente en temporada de cosecha
- **Market inefficiency:** No existe una plataforma dedicada a este problema en Argentina

## Solution
Plataforma de subastas/logística que permite:
1. Empresas publicar necesidades de transporte (origen, destino, tipo de carga, fecha)
2. Transportistas ver ofertas disponibles y competir mediante subastas
3. Matching automático basado en rutas, precios y ratings

## Business Model
- Comisión por transacción exitosa (% del valor del flete)
- Suscripción premium para empresas con alto volumen
- Publicidad dirigida a transportistas

## Target Users
1. **Empresas:** Agroquímicas, exportadoras, empresas de logística, fábricas
2. **Transportistas:** Camioneros independientes y flotas pequeñas

## Tech Stack
- **Backend:** Node.js/TypeScript o Python/FastAPI
- **Frontend:** React/Vue.js con mobile-first approach
- **Database:** PostgreSQL
- **Cache:** Redis
- **Infrastructure:** Docker, Kubernetes on AWS/DigitalOcean
- **Maps:** OpenStreetMap / Google Maps API

## Core Features
1. Auth y gestión de usuarios (empresas y transportistas)
2. Publicación de viajes/ofertas
3. Sistema de subastas inversas
4. Tracking GPS en tiempo real
5. Sistema de pagos y facturación
6. Ratings y calificaciones
7. Chat empresa-transportista
8. Panel de administración

## Status
En fase de diseño y especificación.