package com.wordquiz.ui.word

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.wordquiz.R
import com.wordquiz.WordQuizApp
import com.wordquiz.data.model.Word
import com.wordquiz.databinding.FragmentWordListBinding
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class WordListFragment : Fragment() {
    private var _binding: FragmentWordListBinding? = null
    private val binding get() = _binding!!

    private lateinit var adapter: WordAdapter
    private var unitId: Long = 0
    private var unitName: String = ""

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentWordListBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        unitId = arguments?.getLong("unitId") ?: 0
        unitName = arguments?.getString("unitName") ?: ""

        setupRecyclerView()
        setupFab()
        observeWords()
    }

    private fun setupRecyclerView() {
        adapter = WordAdapter(
            onItemClick = { word ->
                showEditDeleteDialog(word)
            },
            onItemLongClick = { word ->
                showEditDeleteDialog(word)
            }
        )
        binding.rvWords.layoutManager = LinearLayoutManager(requireContext())
        binding.rvWords.adapter = adapter
    }

    private fun setupFab() {
        binding.fabAdd.setOnClickListener {
            showAddDialog()
        }
    }

    private fun observeWords() {
        val app = requireActivity().application as WordQuizApp
        lifecycleScope.launch {
            app.wordRepository.getWordsByUnitId(unitId).collectLatest { words ->
                adapter.submitList(words)
                binding.tvEmpty.visibility = if (words.isEmpty()) View.VISIBLE else View.GONE
            }
        }
    }

    private fun showAddDialog() {
        val dialogView = layoutInflater.inflate(R.layout.dialog_word, null)
        val etEnglish = dialogView.findViewById<EditText>(R.id.et_english)
        val etChinese = dialogView.findViewById<EditText>(R.id.et_chinese)
        val etPhonetic = dialogView.findViewById<EditText>(R.id.et_phonetic)
        val etPartOfSpeech = dialogView.findViewById<EditText>(R.id.et_part_of_speech)

        AlertDialog.Builder(requireContext())
            .setTitle(R.string.add_word)
            .setView(dialogView)
            .setPositiveButton(R.string.save) { _, _ ->
                val english = etEnglish.text.toString().trim()
                val chinese = etChinese.text.toString().trim()
                val phonetic = etPhonetic.text.toString().trim()
                val partOfSpeech = etPartOfSpeech.text.toString().trim()

                if (english.isNotEmpty() && chinese.isNotEmpty()) {
                    val word = Word(
                        unitId = unitId,
                        english = english,
                        chinese = chinese,
                        phonetic = phonetic.ifEmpty { null },
                        partOfSpeech = partOfSpeech.ifEmpty { null }
                    )
                    lifecycleScope.launch {
                        val app = requireActivity().application as WordQuizApp
                        app.wordRepository.insertWord(word)
                    }
                }
            }
            .setNegativeButton(R.string.cancel, null)
            .show()
    }

    private fun showEditDeleteDialog(word: Word) {
        AlertDialog.Builder(requireContext())
            .setTitle(word.english)
            .setMessage(word.chinese)
            .setItems(arrayOf("编辑", "删除")) { _, which ->
                when (which) {
                    0 -> showEditDialog(word)
                    1 -> showDeleteConfirmDialog(word)
                }
            }
            .show()
    }

    private fun showEditDialog(word: Word) {
        val dialogView = layoutInflater.inflate(R.layout.dialog_word, null)
        val etEnglish = dialogView.findViewById<EditText>(R.id.et_english)
        val etChinese = dialogView.findViewById<EditText>(R.id.et_chinese)
        val etPhonetic = dialogView.findViewById<EditText>(R.id.et_phonetic)
        val etPartOfSpeech = dialogView.findViewById<EditText>(R.id.et_part_of_speech)

        etEnglish.setText(word.english)
        etChinese.setText(word.chinese)
        etPhonetic.setText(word.phonetic ?: "")
        etPartOfSpeech.setText(word.partOfSpeech ?: "")

        AlertDialog.Builder(requireContext())
            .setTitle(R.string.edit_word)
            .setView(dialogView)
            .setPositiveButton(R.string.save) { _, _ ->
                val english = etEnglish.text.toString().trim()
                val chinese = etChinese.text.toString().trim()
                val phonetic = etPhonetic.text.toString().trim()
                val partOfSpeech = etPartOfSpeech.text.toString().trim()

                if (english.isNotEmpty() && chinese.isNotEmpty()) {
                    val updated = word.copy(
                        english = english,
                        chinese = chinese,
                        phonetic = phonetic.ifEmpty { null },
                        partOfSpeech = partOfSpeech.ifEmpty { null },
                        updatedAt = System.currentTimeMillis()
                    )
                    lifecycleScope.launch {
                        val app = requireActivity().application as WordQuizApp
                        app.wordRepository.updateWord(updated)
                    }
                }
            }
            .setNegativeButton(R.string.cancel, null)
            .show()
    }

    private fun showDeleteConfirmDialog(word: Word) {
        AlertDialog.Builder(requireContext())
            .setTitle(R.string.confirm_delete)
            .setMessage(R.string.confirm_delete_message)
            .setPositiveButton(R.string.delete) { _, _ ->
                lifecycleScope.launch {
                    val app = requireActivity().application as WordQuizApp
                    app.wordRepository.deleteWord(word)
                }
            }
            .setNegativeButton(R.string.cancel, null)
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
