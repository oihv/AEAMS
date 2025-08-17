# Contributing to EAEMS

Thank you for considering contributing to EAEMS! This document provides guidelines for contributing to this authentication system project.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/EAEMS.git
   cd EAEMS
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```
5. **Set up database**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

## 🛠️ Development Workflow

### Making Changes

1. **Create a new branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the project structure

3. **Test your changes**:
   ```bash
   npm run dev
   npx prisma studio
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

### Commit Message Format

We use conventional commits. Please format your commit messages as:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
- `feat: add password reset functionality`
- `fix: resolve database connection issue`
- `docs: update installation guide`

## 🔧 Code Standards

### TypeScript
- Use TypeScript for all new code
- Follow existing type definitions
- Add proper type annotations

### Styling
- Use TailwindCSS for styling
- Follow the existing design patterns
- Ensure responsive design

### Database
- Use Prisma for database operations
- Update schema.prisma for model changes
- Run migrations properly

## 📋 Pull Request Process

1. **Update documentation** if needed
2. **Test your changes** thoroughly
3. **Create a Pull Request** with:
   - Clear title and description
   - Reference any related issues
   - Include screenshots for UI changes
   - List any breaking changes

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Database migrations work
- [ ] Authentication flows work
- [ ] No console errors

## Screenshots (if applicable)
Add screenshots here

## Additional Notes
Any additional information
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration works
- [ ] User login/logout works
- [ ] Protected routes are secured
- [ ] Database operations succeed
- [ ] Prisma Studio displays data
- [ ] No console errors
- [ ] Responsive design works

### Running Tests
Currently, this project uses manual testing. We welcome contributions to add automated tests.

## 📁 Project Structure

```
EAEMS/
├── app/
│   ├── auth/           # Authentication pages
│   ├── api/            # API routes
│   ├── components/     # React components
│   └── lib/           # Utility functions
├── prisma/            # Database schema and migrations
└── docs/              # Documentation
```

## 🎯 Areas for Contribution

We welcome contributions in these areas:

### High Priority
- [ ] Add automated tests (Jest/Cypress)
- [ ] Email verification system
- [ ] Password reset functionality
- [ ] OAuth providers (Google, GitHub)
- [ ] User profile management

### Medium Priority
- [ ] Rate limiting
- [ ] Admin panel
- [ ] User roles and permissions
- [ ] API documentation
- [ ] Docker setup

### Low Priority
- [ ] Dark mode toggle
- [ ] Internationalization (i18n)
- [ ] Analytics integration
- [ ] Performance optimizations

## ❓ Questions?

- Open an issue for bugs or feature requests
- Start a discussion for questions
- Check existing issues before creating new ones

## 📄 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Follow GitHub community guidelines

Thank you for contributing! 🎉
