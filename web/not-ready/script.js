document.addEventListener('DOMContentLoaded', () => {
    // Inicializar AOS (Animate On Scroll)
    AOS.init({
        duration: 800,
        easing: 'ease-out-cubic',
        once: true,
        offset: 100,
        delay: 0
    });

    const hamburger = document.querySelector('.hamburger-menu');
    const navLinks = document.querySelector('.nav-links');
    const dropdowns = document.querySelectorAll('.dropdown');

    // Toggle menu hamburguesa
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
        document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
        
        // Cerrar todos los dropdowns cuando se cierra el menú
        dropdowns.forEach(dropdown => dropdown.classList.remove('active'));
    });

    // Manejo de dropdowns
    dropdowns.forEach(dropdown => {
        const link = dropdown.querySelector('.nav-item');
        
        link.addEventListener('click', (e) => {
            if (PageState.isMobileLayout(window.innerWidth)) {
                e.preventDefault();
                e.stopPropagation();
                
                // Cerrar otros dropdowns
                dropdowns.forEach(other => {
                    if (other !== dropdown) {
                        other.classList.remove('active');
                    }
                });
                
                dropdown.classList.toggle('active');
            }
        });
    });

    // Cerrar al hacer click fuera
    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
            dropdowns.forEach(dropdown => dropdown.classList.remove('active'));
        }
    });

    // Para dispositivos móviles
    if (PageState.isMobileLayout(window.innerWidth)) {
        const dropdowns = document.querySelectorAll('.dropdown');
        
        dropdowns.forEach(dropdown => {
            dropdown.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const isActive = this.classList.contains('active');
                
                // Cerrar todos los dropdowns
                dropdowns.forEach(d => {
                    d.classList.remove('active');
                    d.style.display = 'block';
                });
                
                if (!isActive) {
                    // Abrir el dropdown actual
                    this.classList.add('active');
                    
                    // Ocultar otros dropdowns
                    dropdowns.forEach(d => {
                        if (d !== this) {
                            d.style.display = 'none';
                        }
                    });
                }
            });
        });

        // Cerrar dropdown al hacer click fuera
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.dropdown')) {
                dropdowns.forEach(d => {
                    d.classList.remove('active');
                    d.style.display = 'block';
                });
            }
        });
    }

    // Intersection Observer para ocultar SVGs en la sección del ecosistema
    const ecosystemSection = document.querySelector('.ecosystem-section');
    const houseOutline = document.querySelector('.house-outline');
    const securityOutline = document.querySelector('.security-outline');
    
    if (ecosystemSection && (houseOutline || securityOutline)) {
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -20% 0px',
            threshold: 0.1
        };

        const ecosystemObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const opacity = PageState.outlineOpacity(entry.isIntersecting);
                if (houseOutline) {
                    houseOutline.style.opacity = opacity;
                    houseOutline.style.transition = 'opacity 0.8s ease';
                }
                if (securityOutline) {
                    securityOutline.style.opacity = opacity;
                    securityOutline.style.transition = 'opacity 0.8s ease';
                }
            });
        }, observerOptions);

        ecosystemObserver.observe(ecosystemSection);
    }    // Control de animación Lottie del ecosistema (una sola reproducción)
    const ecosystemLottie = document.querySelector('#ecosystem-lottie');
    let ecosystemAnimationPlayed = false;
    
    if (ecosystemLottie) {
        const lottieObserverOptions = {
            root: null,
            rootMargin: '0px 0px -10% 0px',
            threshold: 0.1
        };

        const playLottieAnimation = () => {
            if (ecosystemAnimationPlayed) return;
            
            console.log('Attempting to play ecosystem Lottie...');
            
            try {
                // Método 1: Usar el método play() si está disponible
                if (typeof ecosystemLottie.play === 'function') {
                    ecosystemLottie.play();
                    ecosystemAnimationPlayed = true;
                    console.log('Lottie played using play() method');
                    return;
                }
                
                // Método 2: Usar autoplay como fallback
                ecosystemLottie.setAttribute('autoplay', 'true');
                
                // Método 3: Reiniciar la animación si es necesario
                if (typeof ecosystemLottie.setCurrentFrame === 'function') {
                    ecosystemLottie.setCurrentFrame(0);
                }
                
                ecosystemAnimationPlayed = true;
                console.log('Lottie started using autoplay fallback');
                
            } catch (error) {
                console.error('Error playing Lottie animation:', error);
                // Último recurso: simplemente marcar como reproducido
                ecosystemAnimationPlayed = true;
            }
        };

        const lottieObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (PageState.shouldStartPlayback(ecosystemAnimationPlayed, entry.isIntersecting)) {
                    console.log('Ecosystem section is in view');
                    playLottieAnimation();
                    
                    // Dejar de observar después del primer intento
                    lottieObserver.unobserve(ecosystemLottie);
                }
            });
        }, lottieObserverOptions);

        // Función para inicializar el observer
        const initializeLottieObserver = () => {
            console.log('Initializing Lottie observer');
            lottieObserver.observe(ecosystemLottie);
        };

        // Esperar a que el dotlottie-player esté listo
        if (ecosystemLottie.addEventListener) {
            ecosystemLottie.addEventListener('ready', initializeLottieObserver);
            ecosystemLottie.addEventListener('load', initializeLottieObserver);
        }

        // Inicializar inmediatamente también como fallback
        setTimeout(initializeLottieObserver, 500);
        
        // Fallback adicional para asegurar que funcione
        setTimeout(() => {
            if (!ecosystemAnimationPlayed) {
                console.log('Fallback: Initializing observer after 2 seconds');
                initializeLottieObserver();
            }
        }, 2000);    }    // Sección AI - Implementación correcta según requisitos
    const aiSection = document.querySelector('.ai-section');
    const aiLottieAnimated = document.querySelector('.ai-lottie-animated');
    const aiTextContent = document.querySelector('.ai-text-content');
    const aiLottieSecond = document.querySelector('.ai-lottie-second');
    const aiLottieMain = document.querySelector('#ai-lottie-main');
    const aiLottieSecondary = document.querySelector('#ai-lottie-secondary');
    
    console.log('🤖 AI Section Elements:', {
        aiSection: !!aiSection,
        aiLottieAnimated: !!aiLottieAnimated,
        aiTextContent: !!aiTextContent,
        gsapAvailable: typeof gsap !== 'undefined'
    });
    
    if (aiSection && aiLottieAnimated && aiTextContent && typeof gsap !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        
        // Función para reproducir Lottie
        const playLottie = (lottieElement, name) => {
            try {
                if (lottieElement) {
                    if (typeof lottieElement.play === 'function') {
                        lottieElement.play();
                        console.log(`✅ ${name} reproducido`);
                    } else {
                        lottieElement.setAttribute('autoplay', 'true');
                        console.log(`✅ ${name} configurado con autoplay`);
                    }
                }
            } catch (error) {
                console.error(`❌ Error reproduciendo ${name}:`, error);
            }
        };
        
        // Inicializar primer Lottie
        if (aiLottieMain) {
            playLottie(aiLottieMain, 'Lottie Principal');
        }
          // ScrollTrigger para pinning y animaciones
        ScrollTrigger.create({
            trigger: aiSection,
            start: "top top",
            end: "+=100%",
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            onUpdate: (self) => {
                const progress = self.progress;
                console.log('📊 AI Progress:', Math.round(progress * 100) + '%');
                
                if (progress <= 0.3) {
                    // Fase 1: Lottie centrado
                    gsap.to(aiLottieAnimated, {
                        x: 0,
                        y: 0,
                        scale: 1,
                        opacity: 1,
                        duration: 0.6,
                        ease: "power2.out"
                    });
                    
                    gsap.to(aiTextContent, {
                        opacity: 0,
                        x: -50,
                        duration: 0.6,
                        ease: "power2.out"
                    });
                    
    
                    
                } else if (progress <= 0.7) {
                    // Fase 2: Lottie se mueve a la derecha + texto aparece
                    const moveProgress = (progress - 0.3) / 0.4; // Normalizar entre fase 2
                    
                    gsap.to(aiLottieAnimated, {
                        x: moveProgress * 300, // Movimiento progresivo
                        y: 0,
                        scale: 1 - (moveProgress * 0.2), // Escala progresiva
                        opacity: 1,
                        duration: 0.3,
                        ease: "none" // Sin easing para suavidad con scrub
                    });
                    
                    gsap.to(aiTextContent, {
                        opacity: moveProgress,
                        x: (1 - moveProgress) * -50,
                        duration: 0.3,
                        ease: "none"
                    });
                    
         
                    
                } else {
                    // Fase 3: Cambio al segundo Lottie
                    const fadeProgress = (progress - 0.7) / 0.3; // Normalizar fase 3
                    
                    gsap.to(aiLottieAnimated, {
                        opacity: 1 - fadeProgress,
                        scale: 0.8 - (fadeProgress * 0.2),
                        x: 300,
                        duration: 0.3,
                        ease: "none"
                    });
                    
                    gsap.to(aiTextContent, {
                        opacity: Math.max(0, 1 - fadeProgress * 2), // Desaparecer más rápido
                        x: 0,
                        duration: 0.3,
                        ease: "none"
                    });
                }
            }
        });
        
        console.log('✅ AI Section ScrollTrigger configurado correctamente');
        
    } else {
        console.error('❌ AI Section: Elementos no encontrados o GSAP no disponible');
    }
    
    // Funcionalidad de Tabs para Hardware Details (simplificada)
    const hardwareTabs = document.querySelectorAll('.hardware-tab');
    const hardwarePanels = document.querySelectorAll('.hardware-panel');
    
    if (hardwareTabs.length > 0 && hardwarePanels.length > 0) {
        hardwareTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-hardware-tab');
                
                // Remover clase active de todos los tabs y panels
                hardwareTabs.forEach(t => t.classList.remove('active'));
                hardwarePanels.forEach(p => p.classList.remove('active'));
                
                // Agregar clase active al tab clickeado
                tab.classList.add('active');
                  // Mostrar el panel correspondiente
                const targetPanel = document.getElementById(`${targetTab}-details`);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                }
            });
        });
        
        console.log('✅ Hardware Tabs configurados correctamente');
    } else {
        console.log('ℹ️ Hardware Tabs: Elementos no encontrados (pueden no estar en esta página)');
    }
});