/**
 * Memory Ball Game
 * Author: Chao Li
 * Date:: July 25, 2025
 * 
 * Description: Implements a memory-based sequence game using SVG.
 * Players must remember and click on a sequence of balls in the correct order.
 * Features include:
 *  - Multiple levels
 *  - Timer countdown
 *  - Attempt tracking (displayed as hearts)
 *  - Hover, click feedback animations (flash, shake)
 *  - High score saved in browser localStorage
 */

class MemoryBallGame {

    constructor() {
        // Game state variables
        this.level = 1          // Current game level
        this.attempts = 3       // Remaining attempts
        this.sequence = []      // Sequence of balls for current level
        this.playerInput = []   // Player input sequence

        this.showing = false    // Flag to indicate if sequence is being displayed
        this.gameOver = false   // Flag to indicate game over

        this.timeLeft = 180     // Timer in seconds
        this.timer = null       // Timer interval ID

        // DOM references
        this.gameArea = document.getElementById("game_area") // SVG container
        this.levelDisplay = document.getElementById("level") // Current level display
        this.attemptDisplay = document.getElementById("attempts") // Remaining attempts (hearts)
        this.timerDisplay = document.getElementById("timer") // Timer display
        this.highDisplay = document.getElementById("high_level") // High score display
        this.timeBar = document.getElementById("time_bar") // Timer progress bar

        // Load high score from localStorage (persistent in browser)
        this.highLevel = localStorage.getItem("memory_high_level") || 0
        this.highDisplay.textContent = this.highLevel

        // Initialize event listeners and display initial hearts
        this.initEvents()
        this.updateHearts(this.attempts)
    }

    /**
     * Initialize Start and Reset button events
     */
    initEvents() {
        document.getElementById("start_btn").addEventListener("click", () => {
            this.startGame()
        })

        document.getElementById("reset_btn").addEventListener("click", () => {
            this.resetGame()
        })
    }

    /**
     * Start a new game: reset state, display sequence, start timer
     */
    startGame() {
        this.resetGame()
        this.showSequence()
        this.startTimer()
    }

    /**
     * Reset all game variables, clear game area, reset UI elements
     */
    resetGame() {
        clearInterval(this.timer)

        this.level = 1
        this.attempts = 3
        this.timeLeft = 180
        this.gameOver = false
        this.levelDisplay.textContent = this.level
        this.attemptDisplay.textContent = this.attempts
        this.timerDisplay.textContent = this.timeLeft
        this.updateHearts(this.attempts) // Update hearts display

        this.timeBar.setAttribute("width", 400)
        this.timeBar.setAttribute("fill", "green")
        this.clearGameArea()
    }

    /**
     * Update the remaining attempts display as heart icons
     * @param {number} attempts - Number of remaining attempts
     */
    updateHearts(attempts) {
        const container=this.attemptDisplay
        container.innerHTML="" // Clear previous hearts
        for(let i=0;i<attempts;i++){
            const heart=document.createElement("span")
            heart.classList.add("heart")
            heart.textContent="❤️"
            container.appendChild(heart)
        }
    }

    /**
     * Clear all balls from the game area
     */
    clearGameArea() {
        while (this.gameArea.firstChild) {
            this.gameArea.removeChild(this.gameArea.firstChild)
        }
    }

    /**
     * Generate a random position for a new ball, avoiding overlap with existing balls
     * @param {Array} existing - array of existing ball positions
     * @param {number} radius - radius of the ball
     * @returns {Object} - Object with x and y coordinates for the new ball
     */
    randomPosition(existing = [], radius = 20) {
        for (let i = 0; i < 500; i++) {
            let x = Math.random() * (400 - 2 * radius) + radius
            let y = Math.random() * (500 - 2 * radius) + radius
            let overlap = false

            existing.forEach(p => {
                let d = Math.hypot(x - p.x, y - p.y)
                if (d < radius * 2 + 5) overlap = true
            })

            if (!overlap) return { x, y }
        }

        // Fallback in rare cases
        return {
            x: Math.random() * 360 + 20,
            y: Math.random() * 460 + 20
        }

    }

    /**
     * Create an SVG ball element with a number
     * @param {number} num - The number to display on the ball
     * @param {Object} pos - Object with x and y coordinates for the ball
     * @param {number} radius - Radius of the ball
     * @returns {Element} - The created SVG group element representing the ball
     */
    createBall(num, pos, radius) {

        let group = document.createElementNS("http://www.w3.org/2000/svg", "g")
        group.classList.add("ball")
        group.setAttribute("data-number", num)

        let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")

        circle.setAttribute("cx", pos.x)
        circle.setAttribute("cy", pos.y)
        circle.setAttribute("r", radius)

        group.appendChild(circle)

        let text = document.createElementNS("http://www.w3.org/2000/svg", "text")

        text.setAttribute("x", pos.x)
        text.setAttribute("y", pos.y)

        text.textContent = num
        text.classList.add("ball-text")

        group.appendChild(text)

        this.gameArea.appendChild(group)

        return group

    }

    /**
     * Display the sequence of balls for the current level
     * Balls appear one by one with glow animation, then hide numbers for player input
     */
    showSequence() {
        this.showing = true
        this.clearGameArea()
        this.sequence = []

        let positions = []
        let radius = parseInt(document.getElementById("size").value) || 20

        for (let i = 1; i <= this.level + 3; i++) {
            let pos = this.randomPosition(positions, radius)
            positions.push(pos)
            this.sequence.push({ number: i, position: pos })
        }

        this.sequence.forEach((item, index) => {
            setTimeout(() => {
                this.clearGameArea()
                let g = this.createBall(item.number, item.position, radius)
                g.classList.add("glow") // Glow effect for sequence display
                item.element = g
                if (index === this.sequence.length - 1) {
                    setTimeout(() => {
                        // Hide numbers for player input
                        this.clearGameArea()
                        this.sequence.forEach(s => {
                            let g = this.createBall(s.number, s.position, radius)
                            g.querySelector("text").style.display = "none"
                            g.addEventListener("click", (e) => this.handleClick(e))
                        })
                        this.showing = false
                    }, 1000)
                }
            }, index * 1000)
        })
    }

    /**
     * Handle user clicking on a ball
     * Provides visual feedback (flash or shake), updates level or attempts
     */
    handleClick(e) {
        if (this.showing || this.gameOver) return

        let ball = e.currentTarget
        let num = parseInt(ball.getAttribute("data-number"))
        let correct = this.playerInput.length + 1

        if (num === correct) {
            // Correct ball clicked
            let circle = ball.querySelector("circle")
            circle.classList.add("flash") // Flash and scale animation
            circle.classList.add("correct") // Turn green
            ball.querySelector("text").style.display = "block"
            this.playerInput.push(num)

            // If sequence completed, go to next level
            if (this.playerInput.length === this.sequence.length) {
                this.level++
                this.levelDisplay.textContent = this.level
                this.playerInput = []
                setTimeout(() => this.showSequence(), 800)
            }
        } else {
            // Incorrect ball clicked
            ball.classList.add("shake") // Shake animation
            ball.querySelector("circle").classList.add("wrong") // Turn red
            this.attempts--
            this.updateHearts(this.attempts) // Update heart display
            this.playerInput = []

            if (this.attempts === 0) {
                this.endGame()
            } else {
                setTimeout(() => this.showSequence(), 800)
            }
        }
    }

    /**
     * Start the countdown timer and update the progress bar
     */
    startTimer() {
        this.timer = setInterval(() => {
            this.timeLeft--
            this.timerDisplay.textContent = this.timeLeft
            let progress = (this.timeLeft / 180) * 400
            this.timeBar.setAttribute("width", progress)

            if (this.timeLeft < 60) {
                this.timeBar.setAttribute("fill", "red")
            } else if (this.timeLeft < 120) {
                this.timeBar.setAttribute("fill", "orange")
            }

            if (this.timeLeft <= 0) {
                this.endGame()
            }
        }, 1000)
    }

    /**
     * End the game: stop timer, show alert, update high score if needed
     */
    endGame() {
        clearInterval(this.timer)

        this.gameOver = true
        let finalLevel = this.level - 1

        if (finalLevel > this.highLevel) {
            // Save new high score in browser localStorage
            this.highLevel = finalLevel
            localStorage.setItem("memory_high_level", finalLevel)
            this.highDisplay.textContent = finalLevel
            alert("New High Level: " + finalLevel)
        } else {
            alert("Game Over. Level reached: " + finalLevel)
        }
    }
}

// Initialize the game
new MemoryBallGame()