package io.washwise.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MachineStatusOverview {
    private int available;
    private int busy;
    private int offline;
    private int maintenance;
    private int error;
}
