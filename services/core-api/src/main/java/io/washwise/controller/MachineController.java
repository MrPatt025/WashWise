package io.washwise.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.washwise.domain.machine.Machine;
import io.washwise.domain.machine.MachineType;
import io.washwise.dto.machine.CreateMachineRequest;
import io.washwise.dto.machine.MachineResponse;
import io.washwise.security.AuthenticatedUser;
import io.washwise.service.MachineService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Machines", description = "Machine management")
@RestController
@RequestMapping("/machines")
@RequiredArgsConstructor
public class MachineController {

    private final MachineService machineService;

    @Operation(summary = "Get all machines (paginated)")
    @GetMapping
    public ResponseEntity<Page<MachineResponse>> getMachines(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PageableDefault(size = 20, sort = "name") Pageable pageable) {
        
        Page<MachineResponse> machines = machineService.getMachines(user.tenantId(), pageable);
        return ResponseEntity.ok(machines);
    }

    @Operation(summary = "Get all machines (no pagination)")
    @GetMapping("/all")
    public ResponseEntity<List<MachineResponse>> getAllMachines(
            @AuthenticationPrincipal AuthenticatedUser user) {
        
        List<MachineResponse> machines = machineService.getAllMachines(user.tenantId());
        return ResponseEntity.ok(machines);
    }

    @Operation(summary = "Get machine by ID")
    @GetMapping("/{id}")
    public ResponseEntity<MachineResponse> getMachine(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthenticatedUser user) {
        
        MachineResponse machine = machineService.getMachine(id, user.tenantId());
        return ResponseEntity.ok(machine);
    }

    @Operation(summary = "Create a new machine")
    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<MachineResponse> createMachine(
            @Valid @RequestBody CreateMachineRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {
        
        MachineResponse machine = machineService.createMachine(request, user.tenantId());
        return ResponseEntity.status(HttpStatus.CREATED).body(machine);
    }

    @Operation(summary = "Update a machine")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<MachineResponse> updateMachine(
            @PathVariable UUID id,
            @Valid @RequestBody CreateMachineRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {
        
        MachineResponse machine = machineService.updateMachine(id, request, user.tenantId());
        return ResponseEntity.ok(machine);
    }

    @Operation(summary = "Delete a machine")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<Void> deleteMachine(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthenticatedUser user) {
        
        machineService.deleteMachine(id, user.tenantId());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Get available machines by type")
    @GetMapping("/available")
    public ResponseEntity<List<MachineResponse>> getAvailableMachines(
            @RequestParam MachineType type,
            @AuthenticationPrincipal AuthenticatedUser user) {
        
        List<MachineResponse> machines = machineService.getAvailableMachines(user.tenantId(), type);
        return ResponseEntity.ok(machines);
    }

    @Operation(summary = "Get machine statistics")
    @GetMapping("/stats")
    public ResponseEntity<MachineService.MachineStats> getStats(
            @AuthenticationPrincipal AuthenticatedUser user) {
        
        MachineService.MachineStats stats = machineService.getStats(user.tenantId());
        return ResponseEntity.ok(stats);
    }

    // Simulation endpoints for testing
    
    @Operation(summary = "Start machine cycle (simulation)")
    @PostMapping("/{id}/start")
    public ResponseEntity<MachineResponse> startCycle(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthenticatedUser user) {
        
        MachineResponse machine = machineService.startCycle(id, user.tenantId());
        return ResponseEntity.ok(machine);
    }

    @Operation(summary = "Complete machine cycle (simulation)")
    @PostMapping("/{id}/complete")
    public ResponseEntity<MachineResponse> completeCycle(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthenticatedUser user) {
        
        MachineResponse machine = machineService.completeCycle(id, user.tenantId());
        return ResponseEntity.ok(machine);
    }

    @Operation(summary = "Set machine error (simulation)")
    @PostMapping("/{id}/error")
    public ResponseEntity<MachineResponse> setError(
            @PathVariable UUID id,
            @RequestBody ErrorRequest errorRequest,
            @AuthenticationPrincipal AuthenticatedUser user) {
        
        MachineResponse machine = machineService.setMachineError(
                id, user.tenantId(), errorRequest.code(), errorRequest.message());
        return ResponseEntity.ok(machine);
    }

    public record ErrorRequest(String code, String message) {}
}
