# Documentation Index

Welcome to the Reaction Hub documentation! This directory contains all project documentation organized by category.

## Quick Links

### For Users
- **[Compound Bonding Guide](./guides/COMPOUND_BONDING_GUIDE.md)** - Learn how to create compounds using the builder

### For Developers
- **[API Reference](./API.md)** - Complete API documentation
- **[Feature Specifications](./features/)** - Detailed specs for each feature

## Documentation Structure

```
docs/
├── README.md (this file)         # Documentation index
├── API.md                         # API reference
├── features/                      # Feature specifications
│   ├── AUTH.md                    # Authentication system
│   ├── COMPOUND.md                # Compound builder
│   ├── ORGANIC.md                 # Organic chemistry builder
│   └── PERIODIC_TABLE.md          # Periodic table feature
├── guides/                        # User guides
│   └── COMPOUND_BONDING_GUIDE.md  # Compound bonding system
└── archive/                       # Implementation logs
    ├── BOND-LENGTH-IMPROVEMENTS.md
    ├── BOND-VISUALIZATION-FEATURE.md
    ├── COMPOUND-3D-IMPROVEMENTS.md
    └── VSEPR-VERIFICATION-REPORT.md
```

## Main Project Docs (Root)
- **[README.md](../README.md)** - Project overview, features, and setup
- **[CLAUDE.md](../CLAUDE.md)** - Project structure and development guide

## Feature Documentation

### Authentication (`features/AUTH.md`)
- Google OAuth setup
- NextAuth.js configuration
- User session management

### Compound Builder (`features/COMPOUND.md`)
- Data models
- Component architecture
- Canvas system
- Bonding logic

### Organic Chemistry (`features/ORGANIC.md`)
- Template system
- Carbon graph editing
- SMILES notation

### Periodic Table (`features/PERIODIC_TABLE.md`)
- Element data structure
- Grid layout
- 3D Bohr models

## API Documentation (`API.md`)

Complete API reference including:
- Elements API
- Compounds API
- Organic Structures API
- Authentication endpoints

## User Guides (`guides/`)

### Compound Bonding Guide
Comprehensive guide to the compound builder:
- Bond types
- Auto-bonding mechanism
- Valency validation
- Manual bonding workflow
- External factors

## Archive (`archive/`)

Implementation logs and verification reports:
- Bond length improvements
- Bond visualization features
- 3D improvements
- VSEPR verification

---

*For more information, visit the main [README](../README.md) or [CLAUDE.md](../CLAUDE.md)*
