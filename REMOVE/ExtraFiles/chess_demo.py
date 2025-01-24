import sys
import pygame

# Initialize pygame
pygame.init()

# Constants
WIDTH, HEIGHT = 800, 800
ROWS, COLS = 8, 8
SQUARE_SIZE = WIDTH // COLS

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
LIGHT_BROWN = (240, 217, 181)
DARK_BROWN = (181, 136, 99)

# Load images
def load_images():
    pieces = ['bB', 'bK', 'bN', 'bP', 'bQ', 'bR', 'wB', 'wK', 'wN', 'wP', 'wQ', 'wR']
    images = {}
    for piece in pieces:
        images[piece] = pygame.transform.scale(pygame.image.load(f'images/{piece}.png'), (SQUARE_SIZE, SQUARE_SIZE))
    return images

# Draw the board
def draw_board(screen):
    colors = [LIGHT_BROWN, DARK_BROWN]
    for row in range(ROWS):
        for col in range(COLS):
            color = colors[(row + col) % 2]
            pygame.draw.rect(screen, color, (col * SQUARE_SIZE, row * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE))

# Initialize the board with pieces
def initialize_board():
    board = [
        ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
        ['bP'] * 8,
        [''] * 8,
        [''] * 8,
        [''] * 8,
        [''] * 8,
        ['wP'] * 8,
        ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
    ]
    return board

# Draw pieces on the board
def draw_pieces(screen, board, images):
    for row in range(ROWS):
        for col in range(COLS):
            piece = board[row][col]
            if piece != '':
                screen.blit(images[piece], (col * SQUARE_SIZE, row * SQUARE_SIZE))

# Main function
def main():
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption('Chess')
    images = load_images()
    clock = pygame.time.Clock()
    board = initialize_board()
    selected_piece = None
    turn = 'w'  # 'w' for white's turn, 'b' for black's turn

    # Main loop
    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            elif event.type == pygame.MOUSEBUTTONDOWN:
                pos = pygame.mouse.get_pos()
                col = pos[0] // SQUARE_SIZE
                row = pos[1] // SQUARE_SIZE
                if selected_piece:
                    # Move the piece
                    piece = board[selected_piece[0]][selected_piece[1]]
                    if piece[0] == turn:
                        board[selected_piece[0]][selected_piece[1]] = ''
                        board[row][col] = piece
                        turn = 'b' if turn == 'w' else 'w'
                    selected_piece = None
                else:
                    # Select a piece
                    if board[row][col] != '' and board[row][col][0] == turn:
                        selected_piece = (row, col)

        draw_board(screen)
        draw_pieces(screen, board, images)
        pygame.display.flip()
        clock.tick(60)

if __name__ == '__main__':
    main()
