// Movimiento entre paneles del tablero
    // Create a single toggleView function outside event listeners
    const toggleView = (direction) => {
        const roomTemp = document.querySelector('.room-temp-container');
        const widgets = document.querySelector('.widgets-container');
        const sensorGrid = document.querySelector('.sensor-grid');
        const thirdPanel = document.querySelector('.third-panel');
        
        gsap.killTweensOf([roomTemp, widgets, sensorGrid, thirdPanel]);
        
        if (direction === 'down') {
            if (!state.isGridVisible && !state.isThirdPanelVisible) {
                // Primera a segunda vista
                gsap.to([roomTemp, widgets], {
                    opacity: 0,
                    y: -20,
                    duration: 0.3,
                    onComplete: () => {
                        roomTemp.style.display = 'none';
                        widgets.style.display = 'none';
                        sensorGrid.style.display = 'grid';
                        gsap.fromTo(sensorGrid, 
                            { opacity: 0, y: 20, display: 'grid' },
                            { 
                                opacity: 1, 
                                y: 0, 
                                duration: 0.3,
                                onComplete: () => {
                                    Object.assign(state, HouseView.nextPanel(state, 'down'));
                                }
                            }
                        );
                    }
                });
            } else if (state.isGridVisible && !state.isThirdPanelVisible) {
                // Segunda a tercera vista
                gsap.to(sensorGrid, {
                    opacity: 0,
                    y: -20,
                    duration: 0.3,
                    onComplete: () => {
                        sensorGrid.style.display = 'none';
                        thirdPanel.style.display = 'block';
                        gsap.fromTo(thirdPanel,
                            { opacity: 0, y: 20 },
                            { 
                                opacity: 1, 
                                y: 0, 
                                duration: 0.3,
                                onComplete: () => {
                                    Object.assign(state, HouseView.nextPanel(state, 'down'));
                                }
                            }
                        );
                    }
                });
            }
        } else if (direction === 'up') {
            if (state.isThirdPanelVisible) {
                // Tercera a segunda vista
                gsap.to(thirdPanel, {
                    opacity: 0,
                    y: 20,
                    duration: 0.3,
                    onComplete: () => {
                        thirdPanel.style.display = 'none';
                        sensorGrid.style.display = 'grid';
                        gsap.fromTo(sensorGrid, 
                            { opacity: 0, y: -20 },
                            { 
                                opacity: 1, 
                                y: 0, 
                                duration: 0.3,
                                onComplete: () => {
                                    Object.assign(state, HouseView.nextPanel(state, 'up'));
                                }
                            }
                        );
                    }
                });
            } else if (state.isGridVisible) {
                // Segunda a primera vista
                gsap.to(sensorGrid, {
                    opacity: 0,
                    y: 20,
                    duration: 0.3,
                    onComplete: () => {
                        sensorGrid.style.display = 'none';
                        roomTemp.style.display = 'flex';
                        widgets.style.display = 'grid';
                        gsap.fromTo([roomTemp, widgets],
                            { opacity: 0, y: -20 },
                            { 
                                opacity: 1, 
                                y: 0, 
                                duration: 0.3,
                                onComplete: () => {
                                    Object.assign(state, HouseView.nextPanel(state, 'up'));
                                }
                            }
                        );
                    }
                });
            }
        }
    };

// Main panel transition function
const handlePanelTransition = (direction) => {
    const roomTemp = document.querySelector('.room-temp-container');
    const widgets = document.querySelector('.widgets-container');
    const sensorGrid = document.querySelector('.sensor-grid');
    const thirdPanel = document.querySelector('.third-panel');

    if (direction === 'down') {
        if (!state.isGridVisible && !state.isThirdPanelVisible) {
            // Primera vista a segunda vista
            gsap.to([roomTemp, widgets], {
                opacity: 0,
                y: -20,
                duration: 0.3,
                onComplete: () => {
                    roomTemp.style.display = 'none';
                    widgets.style.display = 'none';
                    sensorGrid.style.display = 'grid';
                    gsap.fromTo(sensorGrid, 
                        { opacity: 0, y: 20 },
                        { opacity: 1, y: 0, duration: 0.3 }
                    );
                }
            });
            Object.assign(state, HouseView.nextPanel(state, 'down'));
        } else if (state.isGridVisible && !state.isThirdPanelVisible) {
            // Segunda vista a tercera vista
            gsap.to(sensorGrid, {
                opacity: 0,
                y: -20,
                duration: 0.3,
                onComplete: () => {
                    sensorGrid.style.display = 'none';
                    thirdPanel.style.display = 'grid';
                    gsap.fromTo(thirdPanel, 
                        { opacity: 0, y: 20 },
                        { opacity: 1, y: 0, duration: 0.3 }
                    );
                }
            });
            Object.assign(state, HouseView.nextPanel(state, 'down'));
        }
    } else if (direction === 'up') {
        if (state.isThirdPanelVisible) {
            // Tercera vista a segunda vista
            gsap.to(thirdPanel, {
                opacity: 0,
                y: 20,
                duration: 0.3,
                onComplete: () => {
                    thirdPanel.style.display = 'none';
                    sensorGrid.style.display = 'grid';
                    gsap.fromTo(sensorGrid, 
                        { opacity: 0, y: -20 },
                        { opacity: 1, y: 0, duration: 0.3 }
                    );
                }
            });
            Object.assign(state, HouseView.nextPanel(state, 'up'));
        } else if (state.isGridVisible) {
            // Segunda vista a primera vista
            gsap.to(sensorGrid, {
                opacity: 0,
                y: 20,
                duration: 0.3,
                onComplete: () => {
                    sensorGrid.style.display = 'none';
                    roomTemp.style.display = 'flex';
                    widgets.style.display = 'grid';
                    gsap.fromTo([roomTemp, widgets], 
                        { opacity: 0, y: -20 },
                        { opacity: 1, y: 0, duration: 0.3 }
                    );
                }
            });
            Object.assign(state, HouseView.nextPanel(state, 'up'));
        }
    }
};

// Event listeners for navigation
window.addEventListener('wheel', (e) => {
    clearTimeout(state.scrollTimeout);
    const now = Date.now();
    
    const direction = HouseView.wheelDirection(e.deltaY, now - state.lastScrollTime);
    if (direction) {
        handlePanelTransition(direction);
        state.lastScrollTime = now;
    }
    
    state.scrollTimeout = setTimeout(() => {
        state.lastScrollTime = 0;
    }, 500);
}, { passive: true });

document.addEventListener('touchstart', (e) => {
    state.touchStartY = e.touches[0].clientY;
    state.isTouching = true;
}, { passive: true });

document.addEventListener('touchend', (e) => {
    if (state.isTouching && state.touchStartY !== null) {
        const touchEndY = e.changedTouches[0].clientY;
        const diff = state.touchStartY - touchEndY;
        
        if (Math.abs(diff) > 50) {
            handlePanelTransition(diff > 0 ? 'down' : 'up');
        }
        
        state.touchStartY = null;
        state.isTouching = false;
    }
}, { passive: true });

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        
        const now = Date.now();
        if (now - state.lastScrollTime < 500) return;
        
        const direction = e.key === 'ArrowDown' ? 'down' : 'up';
        toggleView(direction);
        state.lastScrollTime = now;
    }
});

// Función para mostrar toast
function showToast(message, type = 'warning') {
    // Limpiar toasts existentes
    const existingToast = document.querySelector('.navigation-toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}-toast glass-effect navigation-toast`;
    toast.innerHTML = `
        <div class="error-icon">
            <i class="fas ${type === 'warning' ? 'fa-exclamation-triangle' : 'fa-exclamation-circle'}"></i>
        </div>
        <span class="toast-text">${message}</span>
    `;

    document.querySelector('.toast-container').appendChild(toast);

    gsap.fromTo(toast,
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3 }
    );

    setTimeout(() => {
        gsap.to(toast, {
            y: -50,
            opacity: 0,
            duration: 0.3,
            onComplete: () => toast.remove()
        });
    }, 2000);
}

// Limpiar timeouts al desmontar
window.addEventListener('beforeunload', () => {
    clearTimeout(state.scrollResetTimeout);
});
