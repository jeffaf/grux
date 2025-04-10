# Architectural Decision Log

## Terminal Directory Handling Review (2024-02-20)

### Context
During terminal enhancement review, a concern was raised about directory tracking in backdoor mode and its reflection in the prompt.

### Investigation Results
- VirtualLinuxEnvironment correctly tracks current working directory (cwd)
- Directory changes are properly reflected in:
  - Internal cwd state
  - PWD environment variable
  - Path resolution for commands
  - Prompt generation using PS1 format

### Decision
Maintain current directory tracking implementation but enhance feedback and visibility:
- Add visual feedback for directory changes
- Ensure immediate prompt updates
- Consider adding directory status to terminal title
- Implement PWD caching for performance

### Rationale
- Current implementation is architecturally sound
- Improvements focus on user feedback rather than core functionality
- Enhanced visibility will improve user experience

## Terminal Enhancements (2024-02-19)

### Tab Completion Implementation
**Context:** The terminal needs better interactivity and user experience, particularly in backdoor mode.

**Decision:** Implement tab completion using xterm.js parser hooks and a dedicated completion system.

**Rationale:**
- Improves user experience by reducing typing needed
- Makes the backdoor mode feel more like a real Linux environment
- xterm.js parser hooks provide a clean way to implement this feature

**Implementation Approach:**
- Use custom DCS sequences for completion requests
- Implement multiple completion providers (commands, paths, options)
- Cache completion results for better performance

### Color Output Enhancement
**Context:** The hack command's color output isn't rendering properly, affecting the visual experience.

**Decision:** Implement custom CSI sequences for color handling using xterm.js parser hooks.

**Rationale:**
- Better control over color rendering
- More consistent visual experience
- Support for advanced color effects in hack commands

**Implementation Approach:**
- Create custom CSI handler for color sequences
- Implement color utilities for consistent usage
- Support 256-color mode for rich output

### Parser Hooks Integration
**Context:** Need to extend terminal functionality beyond basic features.

**Decision:** Implement comprehensive parser hooks system for custom sequences.

**Rationale:**
- Enables advanced terminal features
- Provides framework for future extensions
- Better control over terminal behavior

**Technical Details:**
- Custom sequences for:
  - Tab completion
  - Color rendering
  - Progress indicators
  - System status
- Integration with VirtualLinuxEnvironment

### Impact Analysis
**Positive Impacts:**
- Enhanced user experience
- More realistic terminal emulation
- Better visual feedback
- Framework for future features

**Potential Risks:**
- Performance overhead from hooks
- Complexity in sequence handling
- Backward compatibility concerns

**Mitigation:**
- Implement caching where appropriate
- Careful testing of sequence handling
- Maintain fallback behavior

### Next Steps
1. Implement core parser hooks
2. Add tab completion system
3. Enhance color handling
4. Update documentation
5. Performance testing
6. User feedback collection

This decision log will be updated as implementation progresses and new architectural decisions are made.

## Build Error Resolution (2025-04-07)

### Context
Build failure detected in VirtualLinuxEnvironment.ts due to truncated implementation.

### Investigation Results
- File missing critical methods defined in backdoorPlan.md:
  - execCommand
  - getCompletions
  - resolvePath
  - getEnv/setEnv
  - formatOutput
- Missing class closing brace causing build failure

### Decision
Restore complete implementation according to backdoorPlan.md specifications.

### Rationale
- Original implementation aligned with architectural decisions
- Missing methods are essential for terminal functionality
- Implementation details already specified in backdoorPlan.md

### Impact
- Restoring functionality will fix build error
- No architectural changes needed, just implementation restoration
- All previously planned features remain valid

## Directory Navigation Bug (2025-04-09)

### Context
The ls command is hanging when attempting to navigate directories, particularly when using parent directory navigation ('..').

### Investigation Results
1. VirtualLinuxEnvironment.ts Implementation Issues:
   - Missing execCommand method for handling basic commands
   - No error handling for command execution
   - Incomplete command result formatting

2. VirtualFilesystem.ts Path Resolution Bug:
   - resolvePath method ignores '..' (parent directory) navigation
   - This causes the ls command to hang when trying to navigate up directories
   - No proper error handling for invalid paths

### Decision
1. Complete VirtualLinuxEnvironment Implementation:
   - Add execCommand method with proper command handlers
   - Implement error handling and timeout protection
   - Add formatted output support for ls command

2. Fix Path Resolution:
   - Update resolvePath to properly handle '..' navigation
   - Add path validation and normalization
   - Implement proper error handling for invalid paths
   - Add path caching for improved performance

### Rationale
- Current implementation is incomplete and lacks robust error handling
- Path resolution is a critical component that needs to be fixed
- Users expect standard Linux navigation behavior
- Performance optimization needed for complex path operations

### Implementation Plan
1. Fix Path Resolution:
   ```typescript
   // Add to VirtualFilesystem class
   private normalizePath(path: string): string {
     const parts = path.split('/').filter(p => p !== '' && p !== '.');
     const normalized: string[] = [];
     
     for (const part of parts) {
       if (part === '..') {
         normalized.pop();
       } else {
         normalized.push(part);
       }
     }
     
     return '/' + normalized.join('/');
   }
   ```

2. Update resolvePath to use normalized paths and handle errors gracefully

3. Add command execution with timeout protection:
   ```typescript
   // Add to VirtualLinuxEnvironment
   public async execCommand(cmd: string, args: string[]): Promise<CommandResult> {
     const timeout = new Promise((_, reject) => 
       setTimeout(() => reject(new Error('Command timed out')), 5000)
     );
     
     const execution = this.executeCommand(cmd, args);
     return Promise.race([execution, timeout]);
   }
   ```

### Success Metrics
- ls command works correctly with all path variations
- No hanging when navigating directories
- Improved error messages for invalid paths
- Response time under 100ms for path operations

### Next Steps
1. Code the proposed fixes
2. Add comprehensive test suite
3. Update documentation
4. Collect user feedback

## Backdoor Mode TypeError Fix (2025-04-09)

### Context
When entering backdoor mode by typing the "backdoor" command, users would encounter a TypeError: "Cannot read properties of undefined (reading 'dimensions')" error.

### Investigation Results
1. Terminal Initialization Issues:
   - The xterm.js terminal requires proper initialization before accessing properties like dimensions
   - The enterBackdoorMode function was attempting to access terminal properties before they were fully initialized
   - Insufficient error handling led to unrecoverable errors

2. Race Condition:
   - The requestAnimationFrame approach did not provide sufficient time for terminal initialization
   - Matrix Rain animation and backdoor mode were competing for terminal resources
   - Timing issues caused dimensions to be undefined when accessed

### Decision
1. Implement Robust Error Handling:
   - Add try/catch blocks around all terminal operations
   - Log detailed error information to help with debugging
   - Show user-friendly error messages instead of crashing

2. Fix Race Condition:
   - Add delays with setTimeout to ensure proper terminal initialization
   - Ensure Matrix Rain is fully stopped before entering backdoor mode
   - Add additional checks for terminal readiness (isTerminalReady state)
   - Use multiple requestAnimationFrame calls with delays for better timing

3. Add Defensive Programming:
   - Check for null/undefined values before access
   - Add fallback behavior for error cases
   - Use optional chaining for safer property access
   - Add proper cleanup in case of errors

### Rationale
- Users expect robust behavior when entering special modes
- Timing issues with terminal initialization are common in web environments
- Proper error handling improves user experience and aids debugging
- Defensive programming prevents cascading failures

### Implementation
The fix involves several key changes:
- Implementing a comprehensive monkey patch for the xterm.js dimensions issue
- Patching both the renderService dimensions and the Viewport._innerRefresh method
- Ensuring the patch is applied during both initial terminal setup and backdoor mode
- Providing default dimension values to prevent the error
- Implementing robust error handling with try/catch
- Providing user feedback for error conditions

### Implementation Details
The specific implementation includes:

1. Creating a comprehensive monkey patch function to fix the dimensions issue:
```typescript
// Comprehensive monkey patch for xterm.js dimensions issue
const monkeyPatchTerminal = useCallback((term: Terminal) => {
  try {
    // @ts-ignore - Accessing internal property to apply monkey patch
    const core = term._core;
    if (!core) return;

    console.log("Applying comprehensive terminal monkey patch");

    // 1. Patch the renderService dimensions
    if (core.renderer?._renderService && !core.renderer._renderService.dimensions) {
      // @ts-ignore - Create a minimal dimensions object to prevent errors
      core.renderer._renderService.dimensions = {
        device: {
          cell: { width: 9, height: 17 },
          canvas: { width: 800, height: 600 }
        },
        actualCellWidth: 9,
        actualCellHeight: 17
      };
    }

    // 2. Patch the Viewport._innerRefresh method to handle missing dimensions
    if (core.viewport) {
      // @ts-ignore - Save the original method
      const originalInnerRefresh = core.viewport._innerRefresh;
      
      // @ts-ignore - Replace with our safe version
      core.viewport._innerRefresh = function() {
        try {
          // @ts-ignore - Check if renderService exists
          if (!this._renderService) return;
          
          // @ts-ignore - Check if dimensions exists
          if (!this._renderService.dimensions) {
            // @ts-ignore - Create dimensions if missing
            this._renderService.dimensions = {
              device: {
                cell: { width: 9, height: 17 },
                canvas: { width: 800, height: 600 }
              },
              actualCellWidth: 9,
              actualCellHeight: 17
            };
          }
          
          // Call original with try/catch
          try {
            originalInnerRefresh.apply(this);
          } catch (e) {
            console.warn("Error in original _innerRefresh:", e);
          }
        } catch (e) {
          console.warn("Error in patched _innerRefresh:", e);
        }
      };
    }
  } catch (e) {
    console.warn("Failed to apply terminal monkey patch:", e);
  }
}, []);
```

2. Applying the monkey patch during terminal initialization:
```typescript
// Simple terminal initialization
try {
  // First animation frame to ensure terminal is in DOM
  await new Promise(resolve => requestAnimationFrame(resolve));
  
  // Perform initial fit
  if (fitAddon.current) {
    fitAddon.current.fit();
  }
  
  // Second animation frame to allow fit to complete
  await new Promise(resolve => requestAnimationFrame(resolve));
  
  // Apply monkey patch to prevent dimensions error
  if (terminal.current) {
    monkeyPatchTerminal(terminal.current);
  }
  
  // Mark terminal as ready
  setIsTerminalReady(true);
  
  // Write welcome message and create line reader
  // ...
} catch (error) {
  console.error("[Terminal] Error during initialization:", error);
}
```

3. Applying the monkey patch when entering backdoor mode:
```typescript
try {
  // Apply comprehensive monkey patch to prevent dimensions error
  if (terminal.current) {
    monkeyPatchTerminal(terminal.current);
  }
  
  // Create virtual environment
  virtualEnv.current = new VirtualLinuxEnvironment();
  setIsBackdoorMode(true);
  
  // Clear the terminal safely
  // ...
} catch (error) {
  // Error handling
}
```

### Testing Results
- This comprehensive monkey patch approach successfully resolves the "Cannot read properties of undefined (reading 'dimensions')" error
- By patching both the renderService dimensions and the Viewport._innerRefresh method, we prevent the error from occurring in all scenarios
- The terminal now initializes properly without errors
- The backdoor mode works correctly with this approach

### Future Considerations
- Consider upgrading to newer versions of xterm.js when available (this issue is specific to 5.3.0)
- This is a temporary workaround for a bug in the xterm.js library
- The monkey patch approach is not ideal but necessary given the constraints
- Method swizzling should be used cautiously and only when absolutely necessary