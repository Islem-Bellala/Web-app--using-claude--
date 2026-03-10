"""
StructCalc — Base Adapter (Abstract)
======================================
Defines the common interface that ALL structural software adapters must implement.
Robot and ETABS adapters will inherit from this class.

Architecture principle:
    If you can write a Robot adapter and an ETABS adapter that both implement
    this interface, then the Engineering Core never needs to know which
    software the data came from. It always receives a StructuralModel.

                Robot API
                    ↓
            RobotAdapter (implements BaseAdapter)
                    ↓
            StructuralModel  ←── Engineering Core reads this
                    ↑
            EtabsAdapter (implements BaseAdapter)
                    ↑
                ETABS API

Author: StructCalc
"""

from abc import ABC, abstractmethod
from typing import List

# Import from the Engineering Core — adapters produce these objects
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

from calculation_engine.core.structural_model import (
    StructuralModel,
    Node,
    Member,
    LoadCase,
    Story,
    MemberForce,
)


class BaseAdapter(ABC):
    """
    Abstract base class for all structural software adapters.

    Every adapter must:
        1. Connect to the software
        2. Extract data and convert it to the Unified Structural Model
        3. Write back response spectra and load combinations

    Usage:
        adapter = RobotAdapter()
        adapter.connect()
        model = adapter.extract_model()
        # → model is now a StructuralModel, ready for engineering calculations
    """

    @abstractmethod
    def connect(self) -> bool:
        """
        Establishes connection to the structural software.

        Returns:
            True if connection successful, False otherwise
        """
        pass

    @abstractmethod
    def is_connected(self) -> bool:
        """Returns True if currently connected to the software."""
        pass

    @abstractmethod
    def get_software_name(self) -> str:
        """Returns the software name: 'Robot' or 'ETABS'."""
        pass

    @abstractmethod
    def extract_model(self) -> StructuralModel:
        """
        Reads all structural data from the software and converts it
        to a StructuralModel.

        Returns:
            StructuralModel — the unified model ready for calculations
        """
        pass

    @abstractmethod
    def extract_nodes(self) -> List[Node]:
        """Extracts all nodes/joints from the model."""
        pass

    @abstractmethod
    def extract_members(self) -> List[Member]:
        """Extracts all structural members (bars, frames, etc.)."""
        pass

    @abstractmethod
    def extract_load_cases(self) -> List[LoadCase]:
        """Extracts defined load cases (G, Q, Ex, Ey, etc.)."""
        pass

    @abstractmethod
    def extract_stories(self) -> List[Story]:
        """Extracts storey/floor data."""
        pass

    @abstractmethod
    def write_response_spectrum(
        self,
        spectrum_points: List[tuple],
        name: str = "RPA2024_Spectrum",
    ) -> bool:
        """
        Writes the RPA 2024 response spectrum back into the software.

        Args:
            spectrum_points: List of (T, Sa/g) tuples from spectrum computation
            name:            Name to give the spectrum in the software

        Returns:
            True if written successfully
        """
        pass

    @abstractmethod
    def write_load_combinations(
        self,
        combinations: list,
    ) -> bool:
        """
        Writes load combinations into the software.

        Args:
            combinations: List of LoadCombination objects

        Returns:
            True if written successfully
        """
        pass

    def disconnect(self) -> None:
        """
        Closes connection to the software.
        Default implementation — override if needed.
        """
        pass

    def __repr__(self) -> str:
        status = "Connected ✅" if self.is_connected() else "Disconnected ❌"
        return f"{self.get_software_name()} Adapter — {status}"
