package com.wordquiz.ui.textbook

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import androidx.appcompat.app.AlertDialog
import androidx.core.os.bundleOf
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.wordquiz.R
import com.wordquiz.WordQuizApp
import com.wordquiz.data.model.Textbook
import com.wordquiz.databinding.FragmentTextbookListBinding
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class TextbookListFragment : Fragment() {
    private var _binding: FragmentTextbookListBinding? = null
    private val binding get() = _binding!!

    private lateinit var adapter: TextbookAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentTextbookListBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupRecyclerView()
        setupFab()
        observeTextbooks()
    }

    private fun setupRecyclerView() {
        adapter = TextbookAdapter(
            onItemClick = { textbook ->
                val bundle = bundleOf(
                    "textbookId" to textbook.id,
                    "textbookName" to textbook.name
                )
                findNavController().navigate(R.id.action_textbooks_to_units, bundle)
            },
            onItemLongClick = { textbook ->
                showEditDeleteDialog(textbook)
            }
        )
        binding.rvTextbooks.layoutManager = LinearLayoutManager(requireContext())
        binding.rvTextbooks.adapter = adapter
    }

    private fun setupFab() {
        binding.fabAdd.setOnClickListener {
            showAddDialog()
        }
    }

    private fun observeTextbooks() {
        val app = requireActivity().application as WordQuizApp
        lifecycleScope.launch {
            app.textbookRepository.allTextbooks.collectLatest { textbooks ->
                adapter.submitList(textbooks)
                binding.tvEmpty.visibility = if (textbooks.isEmpty()) View.VISIBLE else View.GONE
            }
        }
    }

    private fun showAddDialog() {
        val dialogView = layoutInflater.inflate(R.layout.dialog_textbook, null)
        val etName = dialogView.findViewById<EditText>(R.id.et_name)
        val etDescription = dialogView.findViewById<EditText>(R.id.et_description)

        AlertDialog.Builder(requireContext())
            .setTitle(R.string.add_textbook)
            .setView(dialogView)
            .setPositiveButton(R.string.save) { _, _ ->
                val name = etName.text.toString().trim()
                val description = etDescription.text.toString().trim()
                if (name.isNotEmpty()) {
                    val textbook = Textbook(
                        name = name,
                        description = description.ifEmpty { null }
                    )
                    lifecycleScope.launch {
                        val app = requireActivity().application as WordQuizApp
                        app.textbookRepository.insertTextbook(textbook)
                    }
                }
            }
            .setNegativeButton(R.string.cancel, null)
            .show()
    }

    private fun showEditDeleteDialog(textbook: Textbook) {
        AlertDialog.Builder(requireContext())
            .setTitle(textbook.name)
            .setItems(arrayOf("编辑", "删除")) { _, which ->
                when (which) {
                    0 -> showEditDialog(textbook)
                    1 -> showDeleteConfirmDialog(textbook)
                }
            }
            .show()
    }

    private fun showEditDialog(textbook: Textbook) {
        val dialogView = layoutInflater.inflate(R.layout.dialog_textbook, null)
        val etName = dialogView.findViewById<EditText>(R.id.et_name)
        val etDescription = dialogView.findViewById<EditText>(R.id.et_description)
        etName.setText(textbook.name)
        etDescription.setText(textbook.description ?: "")

        AlertDialog.Builder(requireContext())
            .setTitle(R.string.edit_textbook)
            .setView(dialogView)
            .setPositiveButton(R.string.save) { _, _ ->
                val name = etName.text.toString().trim()
                val description = etDescription.text.toString().trim()
                if (name.isNotEmpty()) {
                    val updated = textbook.copy(
                        name = name,
                        description = description.ifEmpty { null },
                        updatedAt = System.currentTimeMillis()
                    )
                    lifecycleScope.launch {
                        val app = requireActivity().application as WordQuizApp
                        app.textbookRepository.updateTextbook(updated)
                    }
                }
            }
            .setNegativeButton(R.string.cancel, null)
            .show()
    }

    private fun showDeleteConfirmDialog(textbook: Textbook) {
        AlertDialog.Builder(requireContext())
            .setTitle(R.string.confirm_delete)
            .setMessage(R.string.confirm_delete_message)
            .setPositiveButton(R.string.delete) { _, _ ->
                lifecycleScope.launch {
                    val app = requireActivity().application as WordQuizApp
                    app.textbookRepository.deleteTextbook(textbook)
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
