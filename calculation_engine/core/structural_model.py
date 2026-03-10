"""
StructCalc — Unified Structural Model
======================================
This module defines the core data classes that represent a structural model
in a software-agnostic way. Both Robot and ETABS data are converted into
these classes before any engineering calculation is performed.

Engineering Core Isolation Principle:
    These classes contain ONLY data — no engineering logic, no API code,
    no database code. They are plain Python dataclasses.

Author: StructCalc
Code reference: Internal — Unified Structural Model
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional


# =============================================================================
# ENUMERATIONS
# =============================================================================

class MemberType(Enum):
    """Classification of structural members."""
    BEAM    = "beam"      # Poutre
    COLUMN  = "column"    # Poteau
    WALL    = "wall"      # Voile
    BRACE   = "brace"     # Contreventement
    SLAB    = "slab"      # Dalle


class MaterialType(Enum):
    """Supported structural material types."""
    CONCRETE = "concrete"   # Béton armé
    STEEL    = "steel"      # Acier
    MASONRY  = "masonry"    # Maçonnerie


class LoadCaseType(Enum):
    """Classification of load case types."""
    PERMANENT   = "permanent"    # G — Charges permanentes
    LIVE        = "live"         # Q — Charges d'exploitation
    SEISMIC_X   = "seismic_x"   # Ex — Action sismique X
    SEISMIC_Y   = "seismic_y"   # Ey — Action sismique Y
    SEISMIC_Z   = "seismic_z"   # Ez — Action sismique Z (vertical)
    WIND        = "wind"         # W — Vent
    SNOW        = "snow"         # S — Neige
    OTHER       = "other"


# =============================================================================
# GEOMETRY
# =============================================================================

@dataclass
class Node:
    """
    A point in 3D space — a joint in the structural model.

    Attributes:
        id:  Unique identifier (from Robot or ETABS)
        x:   X coordinate (m)
        y:   Y coordinate (m)
        z:   Z coordinate (m)
    """
    id: int
    x: float   # metres
    y: float   # metres
    z: float   # metres

    def __repr__(self) -> str:
        return f"Node(id={self.id}, x={self.x:.3f}, y={self.y:.3f}, z={self.z:.3f})"


# =============================================================================
# SECTIONS AND MATERIALS
# =============================================================================

@dataclass
class Material:
    """
    Mechanical properties of a structural material.

    Attributes:
        name:           Label used in the software model
        material_type:  CONCRETE / STEEL / MASONRY
        fc28:           Concrete compressive strength (MPa) — béton: fc28
        fy:             Steel yield strength (MPa)        — acier: fe or fy
        E:              Young's modulus (MPa)
    """
    name:          str
    material_type: MaterialType
    fc28:          Optional[float] = None   # MPa — concrete only
    fy:            Optional[float] = None   # MPa — steel only
    E:             Optional[float] = None   # MPa


@dataclass
class Section:
    """
    Cross-section properties of a structural member.

    Attributes:
        name:     Label used in the software model (e.g. "B30x50")
        width:    Section width  b (m)
        depth:    Section depth  h (m)
        area:     Cross-sectional area A (m²)
        Iy:       Moment of inertia about local y-axis (m⁴)
        Iz:       Moment of inertia about local z-axis (m⁴)
        material: Associated material
    """
    name:     str
    width:    float             # metres
    depth:    float             # metres
    area:     Optional[float] = None    # m²
    Iy:       Optional[float] = None    # m⁴
    Iz:       Optional[float] = None    # m⁴
    material: Optional[Material] = None


# =============================================================================
# STRUCTURAL MEMBERS
# =============================================================================

@dataclass
class Member:
    """
    A structural member (beam, column, wall, etc.) connecting two nodes.

    Attributes:
        id:           Unique identifier
        start_node:   Starting node
        end_node:     Ending node
        section:      Cross-section
        member_type:  BEAM / COLUMN / WALL / etc.
        story:        Floor/storey label (optional)
    """
    id:          int
    start_node:  Node
    end_node:    Node
    section:     Section
    member_type: MemberType
    story:       Optional[str] = None

    @property
    def length(self) -> float:
        """Calculates member length from node coordinates (metres)."""
        dx = self.end_node.x - self.start_node.x
        dy = self.end_node.y - self.start_node.y
        dz = self.end_node.z - self.start_node.z
        return (dx**2 + dy**2 + dz**2) ** 0.5

    def __repr__(self) -> str:
        return (f"Member(id={self.id}, type={self.member_type.value}, "
                f"section={self.section.name}, L={self.length:.3f}m)")


# =============================================================================
# LOADS
# =============================================================================

@dataclass
class LoadCase:
    """
    A named load case in the structural model.

    Attributes:
        name:       Label (e.g. "G", "Q", "Ex", "Ey")
        case_type:  Classification of the load case
    """
    name:      str
    case_type: LoadCaseType

    def __repr__(self) -> str:
        return f"LoadCase(name='{self.name}', type={self.case_type.value})"


@dataclass
class LoadCombination:
    """
    A load combination with factors for each load case.
    Used to generate combinations per RPA 2024 / CBA93.

    Example:
        G + Q + Ex + 0.3·Ey  →
        factors = {"G": 1.0, "Q": 1.0, "Ex": 1.0, "Ey": 0.3}

    Attributes:
        name:    Label (e.g. "COMBO_EX_1")
        factors: Dict mapping LoadCase name → coefficient
    """
    name:    str
    factors: dict   # { load_case_name: coefficient }


# =============================================================================
# INTERNAL FORCES
# =============================================================================

@dataclass
class MemberForce:
    """
    Internal forces at a member cross-section for a given load combination.
    Sign convention follows the structural software convention.

    Attributes:
        member_id:         Member identifier
        combination_name:  Load combination label
        N:    Axial force           (kN)    — Effort normal
        V2:   Shear force (local 2) (kN)    — Effort tranchant
        V3:   Shear force (local 3) (kN)
        M2:   Bending moment (local 2) (kN·m)
        M3:   Bending moment (local 3) (kN·m) — Moment fléchissant
        T:    Torsional moment      (kN·m)
        position: Position along member (0.0 = start, 1.0 = end)
    """
    member_id:        int
    combination_name: str
    N:   float = 0.0   # kN
    V2:  float = 0.0   # kN
    V3:  float = 0.0   # kN
    M2:  float = 0.0   # kN·m
    M3:  float = 0.0   # kN·m
    T:   float = 0.0   # kN·m
    position: float = 0.0   # 0.0 to 1.0


# =============================================================================
# STORY DATA
# =============================================================================

@dataclass
class Story:
    """
    Floor / storey data — used in seismic distribution of forces.

    Attributes:
        name:       Label (e.g. "RDC", "Etage 1", "Etage 2")
        elevation:  Height from ground (m)
        mass:       Seismic mass of the storey (tonnes)
        height:     Storey height (m)
    """
    name:      str
    elevation: float            # metres from ground
    mass:      float            # tonnes
    height:    Optional[float] = None   # metres


# =============================================================================
# THE UNIFIED STRUCTURAL MODEL
# =============================================================================

@dataclass
class StructuralModel:
    """
    The top-level unified structural model.
    All engineering calculations operate exclusively on this object.

    This is what the Robot and ETABS adapters produce.
    This is the only input accepted by the Engineering Core.

    Attributes:
        name:          Project/model name
        software:      Origin software ("Robot" or "ETABS")
        nodes:         All nodes in the model
        members:       All structural members
        load_cases:    Defined load cases
        stories:       Storey data (for seismic distribution)
        member_forces: Internal forces per member per combination
    """
    name:          str
    software:      str
    nodes:         List[Node]         = field(default_factory=list)
    members:       List[Member]       = field(default_factory=list)
    load_cases:    List[LoadCase]     = field(default_factory=list)
    stories:       List[Story]        = field(default_factory=list)
    member_forces: List[MemberForce]  = field(default_factory=list)

    # Derived helpers ----------------------------------------------------------

    def get_member(self, member_id: int) -> Optional[Member]:
        """Returns a member by its ID, or None if not found."""
        for m in self.members:
            if m.id == member_id:
                return m
        return None

    def get_members_by_type(self, member_type: MemberType) -> List[Member]:
        """Returns all members of a given type (e.g. all beams)."""
        return [m for m in self.members if m.member_type == member_type]

    def get_forces(self, member_id: int, combination: str) -> Optional[MemberForce]:
        """Returns internal forces for a specific member and combination."""
        for f in self.member_forces:
            if f.member_id == member_id and f.combination_name == combination:
                return f
        return None

    def total_seismic_weight(self) -> float:
        """Returns total seismic weight W = sum of all storey masses × g (kN)."""
        g = 9.81  # m/s²
        return sum(s.mass * g for s in self.stories)

    def summary(self) -> str:
        """Returns a readable summary of the model."""
        return (
            f"Model: {self.name} (from {self.software})\n"
            f"  Nodes   : {len(self.nodes)}\n"
            f"  Members : {len(self.members)}\n"
            f"  Stories : {len(self.stories)}\n"
            f"  Load cases: {[lc.name for lc in self.load_cases]}\n"
            f"  Total seismic weight W = {self.total_seismic_weight():.1f} kN"
        )
