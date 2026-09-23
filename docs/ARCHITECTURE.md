
# Dhaka Tesla Pool — Architecture

## System Overview

Browser → Next.js 14 (App Router) → NestJS API → PostgreSQL


## Tech Stack

| Layer      | Technology         | Reason                                      |
|------------|--------------------|---------------------------------------------|
| Frontend   | Next.js 14         | SSR, App Router, recommended in brief       |
| Backend    | NestJS + TypeScript| Structured modules, production-minded       |
| Database   | PostgreSQL         | Relational — pooling/capacity needs FK+constraints |
| ORM        | Prisma             | Type-safe, migration built-in               |
| Auth       | JWT + bcrypt       | Stateless, no paid service needed           |
| Styling    | Tailwind CSS       | Fast, utility-first                         |

## NestJS Modules

- **AuthModule** — JWT login, bcrypt password hashing
- **UsersModule** — Passenger & Driver accounts
- **VehiclesModule** — Tesla/Bullet with seat capacity
- **RidesModule** — Ride request, status lifecycle
- **PoolModule** — Pool matching, fare split, capacity enforcement

## Ride Lifecycle

REQUESTED → MATCHED → DRIVER_ARRIVED → STARTED → COMPLETED
↘ CANCELLED


## Fare Formula

passengerFare = baseFare + distanceCharge - poolDiscount


- Stored as **integer paisa** (1 taka = 100 paisa) to avoid floating point errors
- Example: Nusrat's fare = 5000 paisa (50 taka)

## Database Schema (ERD Summary)

### Tables

- **users** — id, name, email, password_hash, role (PASSENGER/DRIVER), phone
- **vehicles** — id, driver_id (FK), name, capacity, is_online
- **ride_requests** — id, passenger_id (FK), pool_id (FK), pickup_area, destination_area, seats_requested, fare_paisa, status
- **pools** — id, vehicle_id (FK), available_seats, status
- **pool_members** — id, pool_id (FK), ride_request_id (FK), fare_paisa

### Relationships

- User (driver) → owns → Vehicle
- User (passenger) → creates → RideRequest
- Vehicle → hosts → Pool
- Pool → has many → PoolMembers
- RideRequest → joins → Pool via PoolMember

## Geography

Predefined Dhaka areas with lat/long:
- Banani, Gulshan 1, Mohakhali, Dhanmondi, Mirpur, Uttara, Farmgate, Bashundhara

Pool matching rule: Same pickup area OR destination within 2km radius.

## Concurrency Handling

Bullet has 1 seat left. Nusrat and Shirin both try to claim it simultaneously.

**Current approach:** PostgreSQL row-level locking with `SELECT ... FOR UPDATE` via Prisma transactions.

**At scale:** Optimistic locking with version column, or Redis-based distributed lock.