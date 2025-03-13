# Database Migrations with Alembic

This project uses Alembic to manage database schema migrations. This allows you to make changes to your database schema (like adding, removing, or modifying columns) and have those changes automatically applied to your database.

## How to Use Migrations

### When you change your models

Whenever you make changes to your SQLAlchemy models in `database.py` (like adding a new column, changing a column type, or removing a column), you should:

1. Create a new migration:

   ```bash
   alembic revision --autogenerate -m "Description of your changes"
   ```

2. Review the generated migration file in `migrations/versions/` to ensure it correctly captures your changes.

3. Apply the migration to update the database:
   ```bash
   alembic upgrade head
   ```

### Common Migration Commands

- Generate a new migration based on model changes:

  ```bash
  alembic revision --autogenerate -m "Description of changes"
  ```

- Apply all pending migrations:

  ```bash
  alembic upgrade head
  ```

- Rollback the last migration:

  ```bash
  alembic downgrade -1
  ```

- View migration history:

  ```bash
  alembic history
  ```

- Get current migration version:
  ```bash
  alembic current
  ```

## Important Notes

1. Always review generated migration files before applying them. Alembic is good but not perfect at detecting all types of changes.

2. Be careful with data loss. If you're removing columns or changing column types, make sure you have a backup of your data.

3. Test migrations in a development environment before applying them to production.

4. The `create_tables()` function in `database.py` is now only used when running `database.py` directly. For normal application operation, use Alembic migrations instead.

## Troubleshooting

If you encounter issues with migrations:

1. Check the Alembic documentation: https://alembic.sqlalchemy.org/en/latest/
2. Make sure your database connection is working
3. Check for any errors in your model definitions
4. Try running with more verbose output: `alembic upgrade head --verbose`
